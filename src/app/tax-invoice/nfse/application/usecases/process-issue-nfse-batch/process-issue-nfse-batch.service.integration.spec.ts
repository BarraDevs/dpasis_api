import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { NfsGenerationFakeAdapterGateway } from 'src/infra/nfs-generation/adapters/fake/nfs-generation-fake.gateway';
import { NfsBatchErrorKind } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { NfsBatchRejectedError } from 'src/infra/nfs-generation/errors/nfs-batch-rejected.error';
import { NfsProviderConfigError } from 'src/infra/nfs-generation/errors/nfs-provider-config.error';
import { NfseQueueFakeAdapterProducer } from '../../../infra/driven/queue/fake/nfse-queue-fake.producer';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseQueueModule } from '../../queue/nfse-queue.module';
import { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ProcessIssueNfseBatch } from './process-issue-nfse-batch.service';
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
        issRetentionResponsible: 1,
        issValue: 50,
        servicesValue: 1000,
        cClassTrib: '000001',
        ibsCbsCst: '000',
      },
    },
    providerDocument: '12345678000199',
    providerMunicipalRegistration: '12345',
    clientDocument: '98765432000188',
    clientCompanyName: 'Cliente LTDA',
    clientType: 'PJ',
    takerAddress: {
      street: 'Av. Paulista',
      number: '500',
      complement: 'Sala 301',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      cityCodeIbge: '3550308',
      state: 'SP',
      zipCode: '01310-100',
    },
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
    rpsNumber?: number;
    batchProtocol?: string | null;
  } = {},
) {
  return prisma.nfse.create({
    data: {
      companyId,
      clientId: 1,
      rpsNumber: overrides.rpsNumber ?? Date.now() % 100_000,
      rpsSeries: 'NFSE',
      status: overrides.status ?? NfseStatus.PENDING,
      batchProtocol: overrides.batchProtocol ?? null,
      data: makeSnapshot() as unknown as object,
    },
  });
}

describe('ProcessIssueNfseBatch - Integration tests', () => {
  let sut: ProcessIssueNfseBatch;
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

    sut = module.get(ProcessIssueNfseBatch);
    prisma = module.get(PrismaService);
    queueProducer = module.get(TOKENS.NfseQueueProducer);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
  });

  beforeEach(async() => {
    await prisma.truncate();
    queueProducer.addedPollBatchJobs.length = 0;
    nfsGenerationGateway.issueBatchCalls.length = 0;
    nfsGenerationGateway.issueBatchError = null;
    nfsGenerationGateway.issueBatchResult = { batchProtocol: 'fake-protocol' };
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfseNotFoundError when the nfse does not exist', async() => {
    // Act & Assert
    await expect(sut.execute({ nfseId: 999_999 })).rejects.toThrow(NfseNotFoundError);
  });

  it('should be a no-op when the nfse is already ISSUED', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id, {
      status: NfseStatus.ISSUED,
      batchProtocol: 'existing-protocol',
    });

    // Act
    await sut.execute({ nfseId: nfse.id });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.status).toBe(NfseStatus.ISSUED);
    expect(saved?.batchProtocol).toBe('existing-protocol');
    expect(queueProducer.addedPollBatchJobs).toHaveLength(0);
  });

  it('should throw CompanyNfsConfigNotFoundError when the company has no provider config', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const nfse = await seedNfse(prisma, company.id);

    // Act & Assert
    await expect(sut.execute({ nfseId: nfse.id })).rejects.toThrow(CompanyNfsConfigNotFoundError);
  });

  it('should persist AWAITING_PROVIDER when the gateway fails with an ambiguous error', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id);
    nfsGenerationGateway.issueBatchError = new Error('Falha ao enviar lote');

    // Act
    await sut.execute({ nfseId: nfse.id });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    // Erro genérico do gateway é ambíguo: o lote pode ter chegado. Ver P0-03 na auditoria.
    expect(saved?.status).toBe(NfseStatus.AWAITING_PROVIDER);
    expect(saved?.errorMessage).toBe('Falha ao enviar lote');
    expect(queueProducer.addedPollBatchJobs).toHaveLength(0);
  });

  it('should persist FAILED when the provider configuration is invalid', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id);
    nfsGenerationGateway.issueBatchError = new NfsProviderConfigError('Certificado digital não encontrado');

    // Act
    await sut.execute({ nfseId: nfse.id });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      status: NfseStatus.FAILED,
      errorMessage: 'Certificado digital não encontrado',
    });
    expect(queueProducer.addedPollBatchJobs).toHaveLength(0);
  });

  it('should persist FAILED when the batch is rejected for a business reason', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id);
    nfsGenerationGateway.issueBatchError = new NfsBatchRejectedError([
      { code: 'E202', message: 'Código de tributação não informado', kind: NfsBatchErrorKind.BusinessRejection },
    ]);

    // Act
    await sut.execute({ nfseId: nfse.id });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      status: NfseStatus.FAILED,
      errorMessage: 'E202: Código de tributação não informado',
    });
  });

  it('should persist AWAITING_PROVIDER when the batch is rejected as already submitted', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id);
    nfsGenerationGateway.issueBatchError = new NfsBatchRejectedError([
      { code: 'E10', message: 'RPS já informado.', kind: NfsBatchErrorKind.AlreadySubmitted },
    ]);

    // Act
    await sut.execute({ nfseId: nfse.id });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      status: NfseStatus.AWAITING_PROVIDER,
      errorMessage: 'E10: RPS já informado.',
    });
    expect(queueProducer.addedPollBatchJobs).toHaveLength(0);
  });
});
