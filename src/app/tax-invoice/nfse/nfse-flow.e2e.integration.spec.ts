import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DateTime } from 'luxon';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { SweepNfseRecovery } from 'src/app/maintenance/application/usecases/sweep-nfse-recovery/sweep-nfse-recovery.service';
import { MaintenanceModule } from 'src/app/maintenance/maintenance.module';
import { NfmAlreadyHasActiveNfseError } from 'src/app/tax-invoice/nfm/domain/errors/nfm-already-has-active-nfse.error';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { BankPaymentAlreadyExistsError } from 'src/infra/bank-payment/errors/bank-payment-already-exists.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { QueueModule } from 'src/infra/queue/queue.module';
import { NfsGenerationFakeAdapterGateway } from 'src/infra/nfs-generation/adapters/fake/nfs-generation-fake.gateway';
import { NfsBatchSituation } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import type { INfseRepository } from './application/persistence/repository/nfse-repository.interface';
import { IssueNfseInputDto } from './application/usecases/issue-nfse/dtos/issue-nfse.dto';
import type { NfseIssueSnapshot } from './application/usecases/issue-nfse/issue-nfse.service';
import { IssueNfse } from './application/usecases/issue-nfse/issue-nfse.service';
import { NfseStatus } from './domain/enums/nfse-status.enum';
import { NfseModule } from './nfse.module';

/**
 * Teste ponta a ponta do fluxo de emissão, com Postgres e Redis reais.
 *
 * Toda a cobertura existente para no limite do use case: as portas são mockadas e nada atravessa a
 * fila. Os modos de falha que custaram caro nesta auditoria — crash entre dois commits, duas
 * requisições simultâneas para a mesma NFM, timeout ambíguo no envio, recusa por duplicidade do
 * banco — só aparecem quando transação, fila e worker são de verdade.
 *
 * Roda apenas com `QUEUE_E2E=true` (`npm run test:e2e`), porque em teste o BullMQ fica de fora por
 * padrão e a suíte normal não pode depender de Redis.
 */
const e2eEnabled = process.env.QUEUE_E2E === 'true';
const describeE2E = e2eEnabled ? describe : describe.skip;

const WAIT_TIMEOUT_MS = 15_000;
const WAIT_INTERVAL_MS = 50;
/** Atravessar fila e worker leva segundos; o default de 5s do jest é para teste de unidade. */
const TEST_TIMEOUT_MS = 30_000;

async function waitFor<T>(probe: ()=> Promise<T | null | undefined | false>, what: string): Promise<T> {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;

  for (;;) {
    const result = await probe();
    if (result) {
      return result;
    }
    if (Date.now() > deadline) {
      throw new Error(`Timeout esperando: ${what}`);
    }
    await new Promise((resolve) => setTimeout(resolve, WAIT_INTERVAL_MS));
  }
}

function makeIssueInput(companyId: number, clientId: number, nfmId?: number): IssueNfseInputDto {
  return {
    companyId,
    clientId,
    nfmId,
    simpleNationalOptant: false,
    fiscalIncentive: false,
    service: {
      serviceListItemCode: '01.07',
      nbsCode: '1.1501.30.00',
      indopCode: '050101',
      description: 'Desenvolvimento de sistema',
      serviceMunicipalCodeIbge: '3529401',
      issExigibility: 1,
      issWithheld: false,
      servicesValue: 1000,
    },
  };
}

/** Mesmo cálculo do fluxo: dia 15 da competência, com piso na data de emissão. */
function expectedDueDate(): string {
  const today = DateTime.now().setZone(SAO_PAULO_TIMEZONE);
  const configured = today.set({ day: 15 });

  return (configured < today ? today : configured).toFormat('yyyy-MM-dd');
}

function makeSnapshot(companyId: number, clientId: number): NfseIssueSnapshot {
  return {
    input: makeIssueInput(companyId, clientId),
    providerDocument: '12345678000199',
    providerMunicipalRegistration: '12345',
    clientDocument: '98765432000188',
    clientCompanyName: 'Cliente LTDA',
    clientType: 'PJ',
    takerAddress: {
      street: 'Av. Paulista',
      number: '500',
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      cityCodeIbge: '3550308',
      state: 'SP',
      zipCode: '01310-100',
    },
  };
}

describeE2E('Fluxo de NFS-e ponta a ponta (Postgres + Redis reais)', () => {
  jest.setTimeout(TEST_TIMEOUT_MS);

  let app: INestApplication;
  let prisma: PrismaService;
  let issueNfse: IssueNfse;
  let nfseRepository: INfseRepository;
  let sweepNfseRecovery: SweepNfseRecovery;
  // Instância única, injetada por override: os módulos de provedor são dinâmicos e cada `register()`
  // cria um adapter novo, então sem isto o teste configuraria um fake e o worker leria outro.
  const nfsGenerationGateway = new NfsGenerationFakeAdapterGateway();
  const bankPaymentGateway = new BankPaymentFakeAdapterGateway();
  let issueQueue: Queue;
  let pollQueue: Queue;
  let bankPaymentQueue: Queue;

  async function seedIssuableClient(): Promise<{ companyId: number; clientId: number; nfmId: number }> {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const clientId = Number(suffix.slice(-6));

    const company = await prisma.company.create({
      data: {
        name: 'Empresa Teste',
        fantasyName: 'Empresa Teste',
        document: suffix.slice(0, 14),
        active: true,
        zipCode: '01310100',
        street: 'Av Paulista',
        number: '100',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        phone01: '11999999999',
        email01: `empresa-${suffix}@test.com`,
      },
    });

    await prisma.nfsProviderConfig.create({
      data: {
        companyId: company.id,
        vendor: 'giss',
        municipalRegistration: '12345',
        municipalCodeIbge: '3529401',
        serieRps: 'NFSE',
        environment: NfsProviderEnvironment.Demonstration,
        certFilePath: '/certs/x.pfx',
        certPasswordEnvVar: 'X_PASS',
        vendorConfig: { municipioSlug: 'demonstracao' },
      },
    });

    const [group, resale, clientCompany] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${suffix}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.company.create({ data: buildMinimalCompanyData() }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: clientId,
        type: ClientType.PJ,
        document: `${clientId}`.padStart(14, '0'),
        groupId: group.id,
        resaleId: resale.id,
        companyId: clientCompany.id,
        companyName: 'Cliente LTDA',
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const address = await prisma.clientAddress.create({
      data: {
        clientId: client.id,
        type: ClientAddressType.BILLING,
        zipCode: '01310-100',
        street: 'Av Paulista',
        number: '500',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });

    const bank = await prisma.bank.create({
      data: {
        drawer: 'Test Drawer',
        wallet: '123',
        account: '12345',
        agency: '0001',
        bankCode: '001',
        bankName: 'Test Bank',
        active: true,
      },
    });

    await prisma.clientInvoiceConfig.create({
      data: {
        clientId: client.id,
        generateNf: true,
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay: 5,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 15,
        months: [],
        billingAddressId: address.id,
        bankId: bank.id,
        autoProtestBoleto: false,
        issWithheld: false,
      },
    });

    const cnae = await prisma.cnae.create({ data: { code: `C${suffix.slice(-8)}`, description: 'CNAE E2E' } });
    const nbs = await prisma.nbs.create({ data: { code: `N${suffix.slice(-8)}`, description: 'NBS E2E' } });
    const indop = await prisma.indop.create({ data: { code: `I${suffix.slice(-8)}`, description: 'INDOP E2E' } });
    const correlation = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id, serviceListItemCode: '01.07' },
    });

    const nfm = await prisma.nfm.create({
      data: {
        clientId: client.id,
        clientDocument: `${clientId}`.padStart(14, '0'),
        companyName: 'Cliente LTDA',
        referenceMonth: 1,
        referenceYear: 2026,
        totalValueInCents: 100_000,
        cnaeNbsIndopId: correlation.id,
        data: {},
      },
      select: { id: true },
    });

    return { companyId: company.id, clientId: client.id, nfmId: nfm.id };
  }

  /**
   * A escada de consulta começa em 30s; no teste o job da nota é promovido em vez de esperado.
   * Promove só o job desta NFS-e: jobs de casos anteriores continuam na fila e apontam para notas
   * que o `truncate` levou embora.
   */
  async function promoteDelayedFor(queue: Queue, nfseId: number): Promise<void> {
    const job = await waitFor(
      async() => (await queue.getDelayed()).find((delayed) => (delayed.data as { nfseId?: number })?.nfseId === nfseId),
      `job atrasado da NFS-e ${nfseId} na fila ${queue.name}`,
    );
    await job.promote();
  }

  async function waitForStatus(nfseId: number, status: NfseStatus) {
    return waitFor(
      async() => {
        const row = await prisma.nfse.findUnique({ where: { id: nfseId } });
        return row?.status === status ? row : null;
      },
      `NFS-e ${nfseId} em ${status}`,
    );
  }

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      // `QueueModule` traz o `BullModule.forRoot` e o Bull Board: sem ele as filas registradas por
      // `registerQueue` não têm conexão configurada.
      imports: [QueueModule.register(), NfseModule, MaintenanceModule.register()],
    })
      .overrideProvider(TOKENS.NfsGenerationGateway).useValue(nfsGenerationGateway)
      .overrideProvider(TOKENS.BankPaymentGateway).useValue(bankPaymentGateway)
      .compile();

    app = module.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    issueNfse = app.get(IssueNfse);
    nfseRepository = app.get(TOKENS.NfseRepository);
    sweepNfseRecovery = app.get(SweepNfseRecovery);
    issueQueue = app.get(getQueueToken(QueueName.NfseIssue));
    pollQueue = app.get(getQueueToken(QueueName.NfsePoll));
    bankPaymentQueue = app.get(getQueueToken(QueueName.NfseBankPayment));

    // `drain` em vez de `obliterate`: apagar a fila inteira com um worker conectado deixa o worker
    // sem consumir nada pelo resto do processo.
    await Promise.all([issueQueue, pollQueue, bankPaymentQueue].map((queue) => queue.drain(true)));
  });

  beforeEach(async() => {
    await prisma.truncate();

    nfsGenerationGateway.issueBatchCalls.length = 0;
    nfsGenerationGateway.issueBatchError = null;
    nfsGenerationGateway.issueBatchResult = { batchProtocol: 'protocolo-e2e' };
    nfsGenerationGateway.getBatchStatusError = null;
    nfsGenerationGateway.findNfseByRpsError = null;
    nfsGenerationGateway.findNfseByRpsResult = { found: false };
    bankPaymentGateway.issueCalls.length = 0;
    bankPaymentGateway.issueError = null;
  });

  afterAll(async() => {
    await prisma.truncate();
    await app.close();
    await prisma.$disconnect();
  });

  it('should carry a note from reservation to a linked charge, crossing both queues', async() => {
    // Arrange
    const { companyId, clientId, nfmId } = await seedIssuableClient();
    const nfseNumber = '56037';

    // Act
    const issued = await issueNfse.execute(makeIssueInput(companyId, clientId, nfmId));

    const submitted = await waitForStatus(issued.id, NfseStatus.SUBMITTED);
    nfsGenerationGateway.getBatchStatusResult = {
      situation: NfsBatchSituation.Success,
      issuedNotes: [{
        rpsNumber: submitted.rpsNumber,
        rpsSeries: submitted.rpsSeries,
        nfseNumber,
        verificationCode: 'ABC123',
        issueDate: new Date().toISOString(),
      }],
    };
    await promoteDelayedFor(pollQueue, issued.id);

    // Assert
    const finished = await waitFor(
      async() => {
        const row = await prisma.nfse.findUnique({ where: { id: issued.id } });
        return row?.status === NfseStatus.ISSUED && row.bankPaymentRequestCode ? row : null;
      },
      'NFS-e emitida e com cobrança vinculada',
    );

    expect(finished.nfseNumber).toBe(nfseNumber);
    expect(finished.batchProtocol).toBe('protocolo-e2e');
    expect(bankPaymentGateway.issueCalls).toHaveLength(1);
  });

  it('should keep the note recoverable when the process dies between the commit and the dispatch', async() => {
    // Arrange — a NFS-e existe, o job nunca foi enfileirado: a linha de outbox é o único rastro.
    const { companyId, clientId, nfmId } = await seedIssuableClient();
    const reservation = await nfseRepository.reserve({
      companyId,
      clientId,
      rpsSeries: 'NFSE',
      data: makeSnapshot(companyId, clientId) as unknown as Record<string, unknown>,
      nfmId,
      jobName: JobName.IssueNfseBatch,
    });

    await prisma.nfseOutbox.updateMany({
      where: { id: reservation.outboxId },
      data: { availableAt: new Date(Date.now() - 5 * 60_000) },
    });

    // Act
    await sweepNfseRecovery.sweepOutbox();

    // Assert
    await waitForStatus(reservation.nfseId, NfseStatus.SUBMITTED);
    const outbox = await prisma.nfseOutbox.findUnique({ where: { id: reservation.outboxId } });
    expect(outbox?.dispatchedAt).toBeInstanceOf(Date);
    const notes = await prisma.nfse.findMany({ where: { nfmId } });
    expect(notes).toHaveLength(1);
  });

  it('should let only one of two simultaneous issuances create a note for the same NFM', async() => {
    // Arrange
    const { companyId, clientId, nfmId } = await seedIssuableClient();

    // Act
    const results = await Promise.allSettled([
      issueNfse.execute(makeIssueInput(companyId, clientId, nfmId)),
      issueNfse.execute(makeIssueInput(companyId, clientId, nfmId)),
    ]);

    // Assert — duas notas para a mesma NFM significam duas NFS-e no fisco e dois boletos.
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(NfmAlreadyHasActiveNfseError);

    const notes = await prisma.nfse.findMany({ where: { nfmId } });
    expect(notes).toHaveLength(1);
  });

  it('should never mark a note FAILED when the send timed out, and recover it by RPS', async() => {
    // Arrange — resposta perdida: a nota pode existir no provedor.
    const { companyId, clientId, nfmId } = await seedIssuableClient();
    nfsGenerationGateway.issueBatchError = Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });

    // Act
    const issued = await issueNfse.execute(makeIssueInput(companyId, clientId, nfmId));
    const awaiting = await waitForStatus(issued.id, NfseStatus.AWAITING_PROVIDER);

    // Assert — nunca `FAILED`: só o provedor pode afirmar que a nota não existe.
    expect(awaiting.status).toBe(NfseStatus.AWAITING_PROVIDER);

    // Act — a consulta pela chave natural encontra a nota emitida do outro lado.
    nfsGenerationGateway.findNfseByRpsResult = {
      found: true,
      note: {
        rpsNumber: awaiting.rpsNumber,
        rpsSeries: awaiting.rpsSeries,
        nfseNumber: '56038',
        verificationCode: 'XYZ789',
        issueDate: new Date().toISOString(),
      },
    };
    await prisma.nfse.update({ where: { id: issued.id }, data: { nextReconcileAt: new Date(Date.now() - 60_000) } });
    await sweepNfseRecovery.sweepReconciliation();

    // Assert
    const reconciled = await waitForStatus(issued.id, NfseStatus.ISSUED);
    expect(reconciled.nfseNumber).toBe('56038');
    expect(nfsGenerationGateway.issueBatchCalls).toHaveLength(1);
  });

  it('should link the existing charge when the bank refuses a duplicate, instead of leaving it orphaned', async() => {
    // Arrange
    const { companyId, clientId, nfmId } = await seedIssuableClient();
    const existingRequestCode = 'cobranca-ja-existente';
    const issued = await issueNfse.execute(makeIssueInput(companyId, clientId, nfmId));
    const submitted = await waitForStatus(issued.id, NfseStatus.SUBMITTED);

    nfsGenerationGateway.getBatchStatusResult = {
      situation: NfsBatchSituation.Success,
      issuedNotes: [{
        rpsNumber: submitted.rpsNumber,
        rpsSeries: submitted.rpsSeries,
        nfseNumber: '56039',
        verificationCode: 'ABC123',
        issueDate: new Date().toISOString(),
      }],
    };
    bankPaymentGateway.issueError = new BankPaymentAlreadyExistsError(existingRequestCode);
    bankPaymentGateway.findResult = {
      ...bankPaymentGateway.findResult,
      requestCode: existingRequestCode,
      yourNumber: String(issued.id),
      amount: 1000,
      // O vínculo só acontece se `seuNumero`, valor e vencimento baterem: a mensagem do provedor é
      // prosa, e vincular sem conferir é como aceitar qualquer cobrança pelo identificador.
      dueDate: expectedDueDate(),
      status: BankPaymentStatus.EMITTED,
    };

    // Act
    await promoteDelayedFor(pollQueue, issued.id);

    // Assert
    const linked = await waitFor(
      async() => {
        const row = await prisma.nfse.findUnique({ where: { id: issued.id } });
        return row?.bankPaymentRequestCode ? row : null;
      },
      'cobrança existente vinculada à NFS-e',
    );

    expect(linked.bankPaymentRequestCode).toBe(existingRequestCode);
  });
});
