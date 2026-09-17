import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseQueueModule } from '../../queue/nfse-queue.module';
import { SettleNfseBankPayment } from './settle-nfse-bank-payment.service';

let counter = 0;

async function seedNfse(prisma: PrismaService, overrides: Record<string, unknown> = {}) {
  counter += 1;
  return prisma.nfse.create({
    data: {
      companyId: 1,
      clientId: 1,
      rpsNumber: (Date.now() % 100_000) + counter,
      rpsSeries: 'NFSE',
      status: NfseStatus.ISSUED,
      issuedAt: new Date('2026-09-03T10:00:00Z'),
      bankPaymentProvider: BankPaymentProvider.INTER,
      bankPaymentRequestCode: 'req-1',
      bankPaymentRequestedAt: new Date('2026-09-03T10:05:00Z'),
      bankPaymentStatus: BankPaymentStatus.EMITTED,
      bankPaymentConfirmedAt: new Date('2026-09-03T10:15:00Z'),
      bankPaymentNextSettlementAt: new Date('2026-09-03T10:15:00Z'),
      data: {},
      ...overrides,
    },
  });
}

describe('SettleNfseBankPayment - Integration tests', () => {
  let sut: SettleNfseBankPayment;
  let prisma: PrismaService;
  let bankPaymentGateway: BankPaymentFakeAdapterGateway;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggerModule,
        NfseQueueModule.register(),
      ],
    }).compile();

    sut = module.get(SettleNfseBankPayment);
    prisma = module.get(PrismaService);
    bankPaymentGateway = module.get(TOKENS.BankPaymentGateway);
  });

  beforeEach(async() => {
    await prisma.truncate();
    bankPaymentGateway.findCalls.length = 0;
    bankPaymentGateway.findError = null;
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

  it('should persist PAID and the settlement date', async() => {
    // Arrange
    const nfse = await seedNfse(prisma);
    bankPaymentGateway.findResult = {
      ...bankPaymentGateway.findResult,
      requestCode: 'req-1',
      status: BankPaymentStatus.PAID,
    };

    // Act
    await sut.execute({ requestCode: 'req-1' });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.bankPaymentStatus).toBe(BankPaymentStatus.PAID);
    expect(saved?.bankPaymentSettledAt).toBeInstanceOf(Date);
    expect(saved?.bankPaymentNextSettlementAt).toBeNull();
  });

  it.each([BankPaymentStatus.CANCELLED, BankPaymentStatus.EXPIRED])(
    'should persist %s and the settlement date',
    async(status) => {
      // Arrange
      const nfse = await seedNfse(prisma);
      bankPaymentGateway.findResult = {
        ...bankPaymentGateway.findResult,
        requestCode: 'req-1',
        status,
      };

      // Act
      await sut.execute({ requestCode: 'req-1' });

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
      expect(saved?.bankPaymentStatus).toBe(status);
      expect(saved?.bankPaymentSettledAt).toBeInstanceOf(Date);
      expect(saved?.bankPaymentNextSettlementAt).toBeNull();
    },
  );

  it('should not ask the provider for an unknown request code', async() => {
    // Act
    const result = await sut.execute({ requestCode: 'missing' });

    // Assert
    expect(result).toBeNull();
    expect(bankPaymentGateway.findCalls).toHaveLength(0);
  });

  it('should not ask the provider again once the charge is settled', async() => {
    // Arrange
    const nfse = await seedNfse(prisma, { bankPaymentSettledAt: new Date('2026-09-17T12:00:00Z') });

    // Act
    const result = await sut.execute({ nfseId: nfse.id });

    // Assert
    expect(result?.settled).toBe(true);
    expect(bankPaymentGateway.findCalls).toHaveLength(0);
  });

  it('should push the next check when the provider still reports EMITTED', async() => {
    // Arrange
    const nfse = await seedNfse(prisma);
    bankPaymentGateway.findResult = {
      ...bankPaymentGateway.findResult,
      requestCode: 'req-1',
      status: BankPaymentStatus.EMITTED,
    };

    // Act
    const result = await sut.execute({ nfseId: nfse.id });

    // Assert
    expect(result?.settled).toBe(false);
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.bankPaymentSettledAt).toBeNull();
    expect(saved?.bankPaymentNextSettlementAt?.getTime()).toBeGreaterThan(Date.now());
  });

  it('should propagate ExternalApiError when the GET fails', async() => {
    // Arrange
    const nfse = await seedNfse(prisma);
    bankPaymentGateway.findError = new ExternalApiError('Banco Inter indisponível.');

    // Act & Assert
    await expect(sut.execute({ nfseId: nfse.id })).rejects.toThrow(ExternalApiError);
  });
});
