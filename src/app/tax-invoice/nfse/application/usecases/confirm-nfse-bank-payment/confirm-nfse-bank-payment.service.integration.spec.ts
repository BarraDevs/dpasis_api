import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseQueueModule } from '../../queue/nfse-queue.module';
import { ConfirmNfseBankPayment } from './confirm-nfse-bank-payment.service';

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
      data: {},
      ...overrides,
    },
  });
}

describe('ConfirmNfseBankPayment - Integration tests', () => {
  let sut: ConfirmNfseBankPayment;
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

    sut = module.get(ConfirmNfseBankPayment);
    prisma = module.get(PrismaService);
    bankPaymentGateway = module.get(TOKENS.BankPaymentGateway);
  });

  beforeEach(async() => {
    await prisma.truncate();
    bankPaymentGateway.findCalls.length = 0;
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

  it('should persist the confirmed situation reported by the provider', async() => {
    // Arrange
    const nfse = await seedNfse(prisma);
    bankPaymentGateway.findResult = {
      ...bankPaymentGateway.findResult,
      requestCode: 'req-1',
      status: BankPaymentStatus.EMITTED,
    };

    // Act
    await sut.execute({ nfseId: nfse.id });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.bankPaymentStatus).toBe(BankPaymentStatus.EMITTED);
    expect(saved?.bankPaymentConfirmedAt).toBeInstanceOf(Date);
    expect(saved?.bankPaymentSettledAt).toBeNull();
    expect(saved?.bankPaymentNextSettlementAt).toBeInstanceOf(Date);
  });

  it('should persist settledAt when the first GET already reports PAID', async() => {
    // Arrange
    const nfse = await seedNfse(prisma);
    bankPaymentGateway.findResult = {
      ...bankPaymentGateway.findResult,
      requestCode: 'req-1',
      status: BankPaymentStatus.PAID,
    };

    // Act
    await sut.execute({ nfseId: nfse.id });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.bankPaymentStatus).toBe(BankPaymentStatus.PAID);
    expect(saved?.bankPaymentConfirmedAt).toBeInstanceOf(Date);
    expect(saved?.bankPaymentSettledAt).toBeInstanceOf(Date);
    expect(saved?.bankPaymentNextSettlementAt).toBeNull();
  });

  it('should record a failed production without unlinking the charge', async() => {
    // Arrange
    const nfse = await seedNfse(prisma);
    bankPaymentGateway.findResult = {
      ...bankPaymentGateway.findResult,
      requestCode: 'req-1',
      status: BankPaymentStatus.FAILED,
    };

    // Act
    await sut.execute({ nfseId: nfse.id });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      bankPaymentStatus: BankPaymentStatus.FAILED,
      bankPaymentRequestCode: 'req-1',
      bankPaymentConfirmedAt: null,
    });
    expect(saved?.bankPaymentFailedAt).toBeInstanceOf(Date);
  });

  it('should not ask the provider again once the charge is confirmed', async() => {
    // Arrange
    const nfse = await seedNfse(prisma, { bankPaymentConfirmedAt: new Date('2026-09-03T11:00:00Z') });

    // Act
    const result = await sut.execute({ nfseId: nfse.id });

    // Assert
    expect(result).toBeNull();
    expect(bankPaymentGateway.findCalls).toHaveLength(0);
  });
});
