import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { NfsGenerationFakeAdapterGateway } from 'src/infra/nfs-generation/adapters/fake/nfs-generation-fake.gateway';
import { NfsBatchErrorKind } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { NfseQueueFakeAdapterProducer } from '../../../infra/driven/queue/fake/nfse-queue-fake.producer';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseQueueModule } from '../../queue/nfse-queue.module';
import { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ReconcileNfseSource } from './dtos/reconcile-nfse.dto';
import { ReconcileNfse } from './reconcile-nfse.service';

function makeSnapshot(): NfseIssueSnapshot {
  return {
    input: {
      companyId: 1,
      clientId: 1,
      simpleNationalOptant: false,
      fiscalIncentive: false,
      service: {
        serviceListItemCode: '01.07',
        nbsCode: '1.1501.30.00',
        indopCode: '050101',
        description: 'Desenvolvimento de sistema',
        serviceMunicipalCodeIbge: '3529401',
        issExigibility: 1,
        issWithheld: true,
        servicesValue: 1000,
      },
    },
    providerDocument: '12345678000199',
    providerMunicipalRegistration: '12345',
    clientDocument: '98765432000188',
    clientCompanyName: 'Cliente LTDA',
    clientType: 'PJ',
  };
}

async function seedCompany(prisma: PrismaService) {
  return prisma.company.create({
    data: {
      name: 'Empresa Teste',
      fantasyName: 'Empresa Teste',
      document: `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 14),
      active: true,
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '100',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      phone01: '11999999999',
      email01: `empresa-${Date.now()}@test.com`,
    },
  });
}

async function seedProviderConfig(prisma: PrismaService, companyId: number) {
  await prisma.nfsProviderConfig.create({
    data: {
      companyId,
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
}

async function seedNfse(
  prisma: PrismaService,
  companyId: number,
  overrides: { status?: NfseStatus; batchProtocol?: string | null; createdAt?: Date } = {},
) {
  return prisma.nfse.create({
    data: {
      companyId,
      clientId: 1,
      rpsNumber: Date.now() % 100_000,
      rpsSeries: 'NFSE',
      status: overrides.status ?? NfseStatus.AWAITING_PROVIDER,
      batchProtocol: 'batchProtocol' in overrides ? overrides.batchProtocol! : null,
      nextReconcileAt: new Date('2026-09-01T00:00:00Z'),
      ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
      data: makeSnapshot() as unknown as object,
    },
  });
}

describe('ReconcileNfse - Integration tests', () => {
  let sut: ReconcileNfse;
  let prisma: PrismaService;
  let queueProducer: NfseQueueFakeAdapterProducer;
  let nfsGenerationGateway: NfsGenerationFakeAdapterGateway;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggerModule,
        NfseQueueModule.register(),
      ],
    }).compile();

    sut = module.get(ReconcileNfse);
    prisma = module.get(PrismaService);
    queueProducer = module.get(TOKENS.NfseQueueProducer);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
  });

  beforeEach(async() => {
    await prisma.truncate();
    queueProducer.addedIssueBatchJobs.length = 0;
    queueProducer.addedPollBatchJobs.length = 0;
    queueProducer.addedIssueBankPaymentJobs.length = 0;
    nfsGenerationGateway.findNfseByRpsCalls.length = 0;
    nfsGenerationGateway.findNfseByRpsError = null;
    nfsGenerationGateway.findNfseByRpsResult = { found: false };
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfseNotFoundError when the nfse does not exist', async() => {
    await expect(sut.execute({ nfseId: 999_999 })).rejects.toThrow(NfseNotFoundError);
  });

  it('should persist ISSUED and enqueue the bank payment when the provider has the note', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id);
    nfsGenerationGateway.findNfseByRpsResult = {
      found: true,
      note: {
        rpsNumber: nfse.rpsNumber,
        rpsSeries: 'NFSE',
        nfseNumber: '12345',
        verificationCode: 'ABC123',
        issueDate: '2026-09-01T14:00:00',
      },
    };

    // Act
    const result = await sut.execute({ nfseId: nfse.id });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      status: NfseStatus.ISSUED,
      nfseNumber: '12345',
      verificationCode: 'ABC123',
      nextReconcileAt: null,
    });
    expect(queueProducer.addedIssueBankPaymentJobs).toHaveLength(1);
    expect(result.source).toBe(ReconcileNfseSource.ProviderIssued);
  });

  it('should never persist a terminal state from a query error', async() => {
    // Arrange — a mensagem fala da consulta, não do conteúdo do RPS.
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id);
    nfsGenerationGateway.findNfseByRpsResult = {
      found: false,
      errors: [{ code: 'E4', message: 'Inscrição municipal inválida', kind: NfsBatchErrorKind.BusinessRejection }],
    };

    // Act
    await sut.execute({ nfseId: nfse.id });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      status: NfseStatus.AWAITING_PROVIDER,
      errorMessage: 'E4: Inscrição municipal inválida',
    });
    expect(saved?.nextReconcileAt).not.toBeNull();
  });

  it('should send the same RPS again when the provider confirms it never arrived', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id, { batchProtocol: null });
    nfsGenerationGateway.findNfseByRpsResult = {
      found: false,
      errors: [{ code: 'E89', message: 'E89', kind: NfsBatchErrorKind.NotFound }],
    };

    // Act
    await sut.execute({ nfseId: nfse.id });

    // Assert — mesma numeração, nunca uma nova.
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({ status: NfseStatus.PENDING, rpsNumber: nfse.rpsNumber, batchProtocol: null });
    expect(queueProducer.addedIssueBatchJobs).toEqual([
      expect.objectContaining({ data: { nfseId: nfse.id } }),
    ]);
    expect(saved?.nextReconcileAt).not.toBeNull();
  });

  it('should reschedule the batch poll when a protocol exists', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id, { batchProtocol: 'PROTO-1' });

    // Act
    await sut.execute({ nfseId: nfse.id });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({ status: NfseStatus.AWAITING_PROVIDER, batchProtocol: 'PROTO-1' });
    expect(queueProducer.addedPollBatchJobs).toHaveLength(1);
    expect(queueProducer.addedIssueBatchJobs).toHaveLength(0);
  });

  it('should not invent AWAITING_PROVIDER when a REJECTED note is missing at the provider', async() => {
    // Arrange — situação 3 deixou protocolo; E212 não significa lote em voo.
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id, {
      status: NfseStatus.REJECTED,
      batchProtocol: 'PROTO-VELHO',
    });
    nfsGenerationGateway.findNfseByRpsResult = {
      found: false,
      errors: [{ code: 'E212', message: 'NFS-e não encontrada', kind: NfsBatchErrorKind.NotFound }],
    };

    // Act
    const result = await sut.execute({ nfseId: nfse.id });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({ status: NfseStatus.REJECTED, batchProtocol: 'PROTO-VELHO' });
    expect(queueProducer.addedPollBatchJobs).toHaveLength(0);
    expect(queueProducer.addedIssueBatchJobs).toHaveLength(0);
    expect(result.source).toBe(ReconcileNfseSource.ProviderNotFound);
  });

  it('should not touch the provider for an already issued note', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id, { status: NfseStatus.ISSUED });

    // Act
    const result = await sut.execute({ nfseId: nfse.id });

    // Assert
    expect(nfsGenerationGateway.findNfseByRpsCalls).toHaveLength(0);
    expect(result.source).toBe(ReconcileNfseSource.NoOp);
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.nextReconcileAt).toBeNull();
  });
});
