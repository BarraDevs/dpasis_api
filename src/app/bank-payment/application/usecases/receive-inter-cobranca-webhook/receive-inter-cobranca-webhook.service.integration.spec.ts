import { Test } from '@nestjs/testing';
import { BankPaymentModule } from 'src/app/bank-payment/bank-payment.module';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { InterWebhookNotConfiguredError } from '../../../domain/errors/inter-webhook-not-configured.error';
import { InvalidInterWebhookTokenError } from '../../../domain/errors/invalid-inter-webhook-token.error';
import { ReceiveInterCobrancaWebhook } from './receive-inter-cobranca-webhook.service';

const TOKEN = 'test-inter-webhook-token';

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

describe('ReceiveInterCobrancaWebhook - Integration tests', () => {
  let sut: ReceiveInterCobrancaWebhook;
  let prisma: PrismaService;
  let bankPaymentGateway: BankPaymentFakeAdapterGateway;
  let config: ConfigService;
  const previousToken = process.env.INTER_WEBHOOK_TOKEN;

  beforeAll(async() => {
    process.env.INTER_WEBHOOK_TOKEN = TOKEN;

    const module = await Test.createTestingModule({
      imports: [LoggerModule, BankPaymentModule],
    }).compile();

    sut = module.get(ReceiveInterCobrancaWebhook);
    prisma = module.get(PrismaService);
    bankPaymentGateway = module.get(TOKENS.BankPaymentGateway);
    config = module.get(ConfigService);
  });

  beforeEach(async() => {
    await prisma.truncate();
    bankPaymentGateway.findCalls.length = 0;
    bankPaymentGateway.findError = null;
    Object.defineProperty(config, 'interWebhookToken', { configurable: true, get: () => TOKEN });
  });

  afterAll(async() => {
    if (previousToken === undefined) {
      delete process.env.INTER_WEBHOOK_TOKEN;
    }
    else {
      process.env.INTER_WEBHOOK_TOKEN = previousToken;
    }
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should persist PAID when the token is valid', async() => {
    // Arrange
    const nfse = await seedNfse(prisma);
    bankPaymentGateway.findResult = {
      ...bankPaymentGateway.findResult,
      requestCode: 'req-1',
      status: BankPaymentStatus.PAID,
    };

    // Act
    const result = await sut.execute(TOKEN, { codigoSolicitacao: 'req-1' });

    // Assert
    expect(result).toEqual({ processed: 1 });
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.bankPaymentStatus).toBe(BankPaymentStatus.PAID);
    expect(saved?.bankPaymentSettledAt).toBeInstanceOf(Date);
  });

  it('should reject an invalid token without settling', async() => {
    // Arrange
    const nfse = await seedNfse(prisma);
    const before = await prisma.nfse.findUnique({ where: { id: nfse.id } });

    // Act & Assert
    await expect(sut.execute('wrong-inter-webhook-tokn', { codigoSolicitacao: 'req-1' }))
      .rejects.toThrow(InvalidInterWebhookTokenError);
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.bankPaymentStatus).toBe(before?.bankPaymentStatus);
    expect(saved?.bankPaymentSettledAt).toBeNull();
    expect(bankPaymentGateway.findCalls).toHaveLength(0);
  });

  it('should count extracted codes even when the charge is unknown', async() => {
    // Act
    const result = await sut.execute(TOKEN, { codigoSolicitacao: 'missing' });

    // Assert
    expect(result).toEqual({ processed: 1 });
    expect(bankPaymentGateway.findCalls).toHaveLength(0);
  });

  it('should reject when the webhook token is not configured', async() => {
    // Arrange
    Object.defineProperty(config, 'interWebhookToken', { configurable: true, get: () => '' });

    // Act & Assert
    await expect(sut.execute(TOKEN, { codigoSolicitacao: 'req-1' }))
      .rejects.toThrow(InterWebhookNotConfiguredError);
    expect(bankPaymentGateway.findCalls).toHaveLength(0);
  });
});
