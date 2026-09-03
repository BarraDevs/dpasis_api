import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { NfsGenerationFakeAdapterGateway } from 'src/infra/nfs-generation/adapters/fake/nfs-generation-fake.gateway';
import { NfsBatchErrorKind, NfsBatchSituation } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { NfseQueueFakeAdapterProducer } from '../../../infra/driven/queue/fake/nfse-queue-fake.producer';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseQueueModule } from '../../queue/nfse-queue.module';
import { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ProcessPollNfseBatch } from './process-poll-nfse-batch.service';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';

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
  overrides: {
    status?: NfseStatus;
    batchProtocol?: string | null;
  } = {},
) {
  return prisma.nfse.create({
    data: {
      companyId,
      clientId: 1,
      rpsNumber: Date.now() % 100_000,
      rpsSeries: 'NFSE',
      status: overrides.status ?? NfseStatus.SUBMITTED,
      batchProtocol: 'batchProtocol' in overrides ? overrides.batchProtocol! : 'protocol-123',
      data: makeSnapshot() as unknown as object,
    },
  });
}

describe('ProcessPollNfseBatch - Integration tests', () => {
  let sut: ProcessPollNfseBatch;
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

    sut = module.get(ProcessPollNfseBatch);
    prisma = module.get(PrismaService);
    queueProducer = module.get(TOKENS.NfseQueueProducer);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
  });

  beforeEach(async() => {
    await prisma.truncate();
    queueProducer.addedPollBatchJobs.length = 0;
    queueProducer.addedIssueBankPaymentJobs.length = 0;
    nfsGenerationGateway.getBatchStatusCalls.length = 0;
    nfsGenerationGateway.getBatchStatusError = null;
    nfsGenerationGateway.getBatchStatusResult = { situation: NfsBatchSituation.Success };
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfseNotFoundError when the nfse does not exist', async() => {
    await expect(sut.execute({ nfseId: 999_999, attempt: 1 })).rejects.toThrow(NfseNotFoundError);
  });

  it('should be a no-op when the nfse is already ISSUED', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id, { status: NfseStatus.ISSUED });

    // Act
    await sut.execute({ nfseId: nfse.id, attempt: 1 });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.status).toBe(NfseStatus.ISSUED);
    expect(queueProducer.addedPollBatchJobs).toHaveLength(0);
  });

  it('should be a no-op when the nfse has no batchProtocol', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id, { batchProtocol: null });

    // Act
    await sut.execute({ nfseId: nfse.id, attempt: 1 });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.status).toBe(NfseStatus.SUBMITTED);
    expect(queueProducer.addedPollBatchJobs).toHaveLength(0);
  });

  it('should throw CompanyNfsConfigNotFoundError when the company has no provider config', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const nfse = await seedNfse(prisma, company.id);

    // Act & Assert
    await expect(sut.execute({ nfseId: nfse.id, attempt: 1 })).rejects.toThrow(CompanyNfsConfigNotFoundError);
  });

  it('should mark the nfse PROCESSING and reschedule when the gateway fails before max attempts', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id);
    nfsGenerationGateway.getBatchStatusError = new Error('timeout');

    // Act
    await sut.execute({ nfseId: nfse.id, attempt: 1 });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.status).toBe(NfseStatus.PROCESSING);
    expect(queueProducer.addedPollBatchJobs).toEqual([
      expect.objectContaining({
        data: { nfseId: nfse.id, attempt: 2 },
        options: { delayMs: 30_000 },
      }),
    ]);
  });

  it('should mark the nfse AWAITING_PROVIDER when the gateway fails at max attempts', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id);
    nfsGenerationGateway.getBatchStatusError = new Error('timeout');

    // Act
    await sut.execute({ nfseId: nfse.id, attempt: 8 });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    // Existe protocolo: só uma consulta ao provedor pode afirmar que a nota não foi emitida.
    expect(saved?.status).toBe(NfseStatus.AWAITING_PROVIDER);
    expect(saved?.errorMessage).toBe('Erro ao consultar status do lote no Giss: timeout');
    expect(queueProducer.addedPollBatchJobs).toHaveLength(0);
  });

  it('should park the nfse in AWAITING_PROVIDER when Giss reports success without issued notes', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id);
    nfsGenerationGateway.getBatchStatusResult = {
      situation: NfsBatchSituation.Success,
      issuedNotes: [],
    };

    // Act
    await sut.execute({ nfseId: nfse.id, attempt: 1 });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      status: NfseStatus.AWAITING_PROVIDER,
      errorMessage: 'Giss retornou sucesso na consulta do lote, mas sem dados da NFS-e emitida',
    });
    expect(queueProducer.addedIssueBankPaymentJobs).toHaveLength(0);
  });

  it('should park the nfse in AWAITING_PROVIDER when the provider reports already submitted', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id);
    nfsGenerationGateway.getBatchStatusResult = {
      situation: NfsBatchSituation.Error,
      errors: [
        { code: 'E10', message: 'RPS já informado.', kind: NfsBatchErrorKind.AlreadySubmitted },
      ],
    };

    // Act
    await sut.execute({ nfseId: nfse.id, attempt: 1 });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.status).toBe(NfseStatus.AWAITING_PROVIDER);
    expect(saved?.errorMessage).toContain('RPS já informado');
    expect(queueProducer.addedPollBatchJobs).toHaveLength(0);
  });

  it('should mark the nfse ISSUED and enqueue bank payment job on Giss success', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id);
    nfsGenerationGateway.getBatchStatusResult = {
      situation: NfsBatchSituation.Success,
      issuedNotes: [{
        rpsNumber: nfse.rpsNumber,
        rpsSeries: 'NFSE',
        nfseNumber: '1000',
        verificationCode: 'ABC123',
        issueDate: '2026-07-20T10:00:00',
      }],
    };

    // Act
    await sut.execute({ nfseId: nfse.id, attempt: 1 });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      status: NfseStatus.ISSUED,
      nfseNumber: '1000',
      verificationCode: 'ABC123',
    });
    expect(queueProducer.addedIssueBankPaymentJobs).toEqual([
      expect.objectContaining({
        data: { nfseId: nfse.id },
      }),
    ]);
    expect(queueProducer.addedPollBatchJobs).toHaveLength(0);
  });
});
