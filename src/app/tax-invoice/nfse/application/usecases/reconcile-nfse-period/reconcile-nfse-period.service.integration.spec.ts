import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { NfsGenerationFakeAdapterGateway } from 'src/infra/nfs-generation/adapters/fake/nfs-generation-fake.gateway';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseQueueModule } from '../../queue/nfse-queue.module';
import { ReconcileNfsePeriod } from './reconcile-nfse-period.service';

let counter = 0;

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
      email01: `empresa-${Date.now()}-${counter}@test.com`,
    },
  });
}

async function seedProviderConfig(prisma: PrismaService, companyId: number) {
  await prisma.nfsProviderConfig.create({
    data: {
      companyId,
      vendor: 'giss',
      municipalRegistration: '16895',
      municipalCodeIbge: '3529401',
      serieRps: 'NFSE',
      environment: NfsProviderEnvironment.Demonstration,
      certFilePath: '/certs/x.pfx',
      certPasswordEnvVar: 'X_PASS',
      vendorConfig: { municipioSlug: 'demonstracao' },
    },
  });
}

async function seedNfse(prisma: PrismaService, companyId: number, overrides: Record<string, unknown> = {}) {
  counter += 1;
  return prisma.nfse.create({
    data: {
      companyId,
      clientId: 1,
      rpsNumber: (Date.now() % 100_000) + counter,
      rpsSeries: 'NFSE',
      status: NfseStatus.AWAITING_PROVIDER,
      createdAt: new Date('2026-09-03T12:00:00Z'),
      data: { providerDocument: '12345678000199' },
      ...overrides,
    },
  });
}

describe('ReconcileNfsePeriod - Integration tests', () => {
  let sut: ReconcileNfsePeriod;
  let prisma: PrismaService;
  let nfsGenerationGateway: NfsGenerationFakeAdapterGateway;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggerModule,
        NfseQueueModule.register(),
      ],
    }).compile();

    sut = module.get(ReconcileNfsePeriod);
    prisma = module.get(PrismaService);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
  });

  beforeEach(async() => {
    await prisma.truncate();
    nfsGenerationGateway.listIssuedNfseByPeriodCalls.length = 0;
    nfsGenerationGateway.listIssuedNfseByPeriodError = null;
    nfsGenerationGateway.listIssuedNfseByPeriodResult = { notes: [], endOfPages: true };
    nfsGenerationGateway.findNfseByRpsResult = { found: false };
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should not call the provider when nothing is pending in the window', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    await seedNfse(prisma, company.id, { status: NfseStatus.ISSUED });

    // Act
    const result = await sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03' });

    // Assert
    expect(result.checked).toBe(0);
    expect(nfsGenerationGateway.listIssuedNfseByPeriodCalls).toHaveLength(0);
  });

  it('should report a divergence without writing in dryRun', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id);
    nfsGenerationGateway.listIssuedNfseByPeriodResult = {
      notes: [{
        rpsNumber: nfse.rpsNumber,
        rpsSeries: 'NFSE',
        nfseNumber: '12345',
        verificationCode: 'ABC',
        issueDate: '2026-09-03T10:00:00',
      }],
      endOfPages: true,
    };

    // Act
    const result = await sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03' });

    // Assert
    expect(result).toMatchObject({ checked: 1, corrected: 0, dryRun: true });
    expect(result.divergences[0]).toMatchObject({ nfseId: nfse.id, foundAtProvider: true });
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.status).toBe(NfseStatus.AWAITING_PROVIDER);
  });

  it('should correct the local state when writing is allowed', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id);
    const note = {
      rpsNumber: nfse.rpsNumber,
      rpsSeries: 'NFSE',
      nfseNumber: '12345',
      verificationCode: 'ABC',
      issueDate: '2026-09-03T10:00:00',
    };
    nfsGenerationGateway.listIssuedNfseByPeriodResult = { notes: [note], endOfPages: true };
    // A correção reconsulta pela chave natural antes de gravar.
    nfsGenerationGateway.findNfseByRpsResult = { found: true, note };

    // Act
    const result = await sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03', dryRun: false });

    // Assert
    expect(result.corrected).toBe(1);
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({ status: NfseStatus.ISSUED, nfseNumber: '12345' });
  });

  it('should ignore provider notes with no local counterpart', async() => {
    // Arrange — a consulta devolve todas as notas do prestador, não só as deste sistema.
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedNfse(prisma, company.id);
    nfsGenerationGateway.listIssuedNfseByPeriodResult = {
      notes: [{
        rpsNumber: nfse.rpsNumber + 5000,
        rpsSeries: 'NFSE',
        nfseNumber: '99999',
        verificationCode: 'XYZ',
        issueDate: '2026-09-03T10:00:00',
      }],
      endOfPages: true,
    };

    // Act
    const result = await sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03', dryRun: false });

    // Assert
    expect(result.corrected).toBe(0);
    expect(result.divergences[0].foundAtProvider).toBe(false);
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.status).toBe(NfseStatus.AWAITING_PROVIDER);
  });
});
