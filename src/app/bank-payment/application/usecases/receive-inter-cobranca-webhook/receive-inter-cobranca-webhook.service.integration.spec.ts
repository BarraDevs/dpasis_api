import { Test, TestingModule } from '@nestjs/testing';
import { BankPaymentModule } from 'src/app/bank-payment/bank-payment.module';
import { CashFlowEntryOrigin } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-origin.enum';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { seedConfiguredBank } from 'src/test/fixtures/seed-configured-bank';
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
  const company = await prisma.company.create({ data: buildMinimalCompanyData() });
  return prisma.nfse.create({
    data: {
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
      companyId: company.id,
    },
  });
}

describe('ReceiveInterCobrancaWebhook - Integration tests', () => {
  let sut: ReceiveInterCobrancaWebhook;
  let prisma: PrismaService;
  let bankPaymentGateway: BankPaymentFakeAdapterGateway;
  let moduleRef: TestingModule;
  let bankId: number;

  beforeAll(async() => {
    moduleRef = await Test.createTestingModule({
      imports: [LoggerModule, BankPaymentModule],
    }).compile();

    sut = moduleRef.get(ReceiveInterCobrancaWebhook);
    prisma = moduleRef.get(PrismaService);
    bankPaymentGateway = moduleRef.get(TOKENS.BankPaymentGateway);
  });

  beforeEach(async() => {
    await prisma.truncate();
    bankPaymentGateway.findCalls.length = 0;
    bankPaymentGateway.findError = null;
    ({ bankId } = await seedConfiguredBank(moduleRef, { webhookToken: TOKEN }));
  });

  afterAll(async() => {
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
    const ledger = await prisma.cashFlowEntry.findUnique({ where: { nfseId: nfse.id } });
    expect(ledger).toEqual(expect.objectContaining({
      type: CashFlowEntryType.CREDIT,
      origin: CashFlowEntryOrigin.BANK_PAYMENT,
      amountInCents: 10000,
    }));
    expect(bankPaymentGateway.findCalls[0].credentials.bankId).toBe(bankId);
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

  it('should reject when the webhook token is blank', async() => {
    await expect(sut.execute('   ', { codigoSolicitacao: 'req-1' }))
      .rejects.toThrow(InterWebhookNotConfiguredError);
    expect(bankPaymentGateway.findCalls).toHaveLength(0);
  });
});
