import { Test } from '@nestjs/testing';
import { MaintenanceModule } from 'src/app/maintenance/maintenance.module';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { TOKENS } from 'src/core/di/token';
import { AlertFakeAdapterGateway } from 'src/infra/alert/adapters/fake/alert-fake.gateway';
import { AlertType } from 'src/infra/alert/enums/alert-type.enum';
import { CacheFakeAdapterGateway } from 'src/infra/cache/adapters/fake/cache-fake.gateway';
import { CacheModule } from 'src/infra/cache/cache.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { SweepNfseAlerts } from './sweep-nfse-alerts.service';

describe('SweepNfseAlerts - Integration tests', () => {
  let sut: SweepNfseAlerts;
  let prisma: PrismaService;
  let alertGateway: AlertFakeAdapterGateway;
  let cacheGateway: CacheFakeAdapterGateway;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        LoggerModule,
        CacheModule.register(),
        MaintenanceModule.register(),
      ],
    }).compile();

    sut = module.get(SweepNfseAlerts);
    prisma = module.get(PrismaService);
    alertGateway = module.get(TOKENS.AlertGateway);
    cacheGateway = module.get(TOKENS.CacheGateway);
  });

  beforeEach(async() => {
    await prisma.truncate();
    alertGateway.sentAlerts.length = 0;
    cacheGateway.claimedKeys.clear();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should send one digest email for stuck nfses older than the threshold', async() => {
    // Arrange
    await prisma.nfse.create({
      data: {
        companyId: 1,
        clientId: 1,
        rpsNumber: Date.now() % 100_000,
        rpsSeries: 'NFSE',
        status: NfseStatus.SUBMITTED,
        data: {},
      },
    });
    await prisma.$executeRawUnsafe(
      'UPDATE nfses SET "updatedAt" = NOW() - INTERVAL \'3 hours\'',
    );

    // Act
    await sut.sweepStuck();

    // Assert
    expect(alertGateway.sentAlerts).toHaveLength(1);
    expect(alertGateway.sentAlerts[0].type).toBe(AlertType.NfseStuck);
    expect(alertGateway.sentAlerts[0].lines[0]).toContain('nfseId=');
  });

  it('should stay silent on a second sweep while the digest window is claimed', async() => {
    // Arrange
    await prisma.nfse.create({
      data: {
        companyId: 1,
        clientId: 1,
        rpsNumber: (Date.now() % 100_000) + 1,
        rpsSeries: 'NFSE',
        status: NfseStatus.PENDING,
        data: {},
      },
    });
    await prisma.$executeRawUnsafe(
      'UPDATE nfses SET "updatedAt" = NOW() - INTERVAL \'3 hours\'',
    );

    // Act
    await sut.sweepStuck();
    await sut.sweepStuck();

    // Assert
    expect(alertGateway.sentAlerts).toHaveLength(1);
  });

  it('should alert on daily closing divergence for the previous São Paulo day', async() => {
    // Arrange — 01/09 SP = [01/09 03:00Z, 02/09 03:00Z)
    await prisma.nfse.create({
      data: {
        companyId: 1,
        clientId: 1,
        rpsNumber: (Date.now() % 100_000) + 2,
        rpsSeries: 'NFSE',
        status: NfseStatus.ISSUED,
        nfseNumber: '100',
        issuedAt: new Date('2026-09-01T12:00:00.000Z'),
        bankPaymentRequestCode: null,
        data: {},
      },
    });
    await prisma.nfse.create({
      data: {
        companyId: 1,
        clientId: 1,
        rpsNumber: (Date.now() % 100_000) + 3,
        rpsSeries: 'NFSE',
        status: NfseStatus.ISSUED,
        nfseNumber: '101',
        issuedAt: new Date('2026-09-01T15:00:00.000Z'),
        bankPaymentRequestCode: 'req-1',
        bankPaymentProvider: 'INTER',
        data: {},
      },
    });

    // Act
    await sut.sweepDailyClosing(new Date('2026-09-02T08:00:00-03:00'));

    // Assert
    expect(alertGateway.sentAlerts).toHaveLength(1);
    expect(alertGateway.sentAlerts[0]).toMatchObject({
      type: AlertType.NfseDailyClosing,
      lines: ['Emitidas: 2', 'Com boleto: 1', 'Sem boleto: 1'],
    });
  });
});
