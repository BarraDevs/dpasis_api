import { Test, TestingModule } from '@nestjs/testing';
import { CashFlowEntryOrigin } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-origin.enum';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { seedClientInvoiceConfig } from 'src/test/fixtures/seed-client-invoice-config';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseQueueModule } from '../../queue/nfse-queue.module';
import { SettleNfseBankPayment } from './settle-nfse-bank-payment.service';

let counter = 0;

async function seedClient(prisma: PrismaService, clientId: number) {
  const group = await prisma.clientGroup.create({ data: { name: `Grupo ${clientId}`, active: true } });
  const resale = await prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) });
  const company = await prisma.company.create({ data: buildMinimalCompanyData() });

  return prisma.client.create({
    data: {
      id: clientId,
      type: ClientType.PJ,
      document: `${clientId}`.padStart(14, '0'),
      ie: null,
      groupId: group.id,
      resaleId: resale.id,
      companyId: company.id,
      companyName: 'Cliente LTDA',
      fantasyName: null,
      headquarters: 'São Paulo',
      invoiceType: ClientInvoiceType.CONTRACT,
      generateInvoice: true,
      active: true,
    },
  });
}

async function seedNfse(
  moduleRef: TestingModule,
  prisma: PrismaService,
  overrides: Record<string, unknown> = {},
) {
  counter += 1;
  const company = await prisma.company.create({ data: buildMinimalCompanyData() });
  const clientId = (Date.now() % 80_000) + counter;
  await seedClient(prisma, clientId);
  await seedClientInvoiceConfig(moduleRef, clientId);

  return prisma.nfse.create({
    data: {
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
      clientId,
    },
  });
}

describe('SettleNfseBankPayment - Integration tests', () => {
  let sut: SettleNfseBankPayment;
  let prisma: PrismaService;
  let moduleRef: TestingModule;
  let bankPaymentGateway: BankPaymentFakeAdapterGateway;

  beforeAll(async() => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggerModule,
        NfseQueueModule.register(),
      ],
    }).compile();

    sut = moduleRef.get(SettleNfseBankPayment);
    prisma = moduleRef.get(PrismaService);
    bankPaymentGateway = moduleRef.get(TOKENS.BankPaymentGateway);
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
    const nfse = await seedNfse(moduleRef, prisma);
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
    const ledger = await prisma.cashFlowEntry.findUnique({ where: { nfseId: nfse.id } });
    expect(ledger).toEqual(expect.objectContaining({
      companyId: nfse.companyId,
      type: CashFlowEntryType.CREDIT,
      origin: CashFlowEntryOrigin.BANK_PAYMENT,
      amountInCents: 10000,
      bankPaymentRequestCode: 'req-1',
    }));
  });

  it.each([BankPaymentStatus.CANCELLED, BankPaymentStatus.EXPIRED])(
    'should persist %s and the settlement date',
    async(status) => {
      // Arrange
      const nfse = await seedNfse(moduleRef, prisma);
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
      expect(await prisma.cashFlowEntry.findUnique({ where: { nfseId: nfse.id } })).toBeNull();
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
    const nfse = await seedNfse(moduleRef, prisma, { bankPaymentSettledAt: new Date('2026-09-17T12:00:00Z') });

    // Act
    const result = await sut.execute({ nfseId: nfse.id });

    // Assert
    expect(result?.settled).toBe(true);
    expect(bankPaymentGateway.findCalls).toHaveLength(0);
  });

  it('should push the next check when the provider still reports EMITTED', async() => {
    // Arrange
    const nfse = await seedNfse(moduleRef, prisma);
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
    expect(await prisma.cashFlowEntry.findUnique({ where: { nfseId: nfse.id } })).toBeNull();
  });

  it('should not duplicate the cash-flow row when already paid', async() => {
    const nfse = await seedNfse(moduleRef, prisma, {
      bankPaymentStatus: BankPaymentStatus.PAID,
      bankPaymentSettledAt: new Date('2026-09-17T12:00:00Z'),
    });
    await prisma.cashFlowEntry.create({
      data: {
        companyId: nfse.companyId,
        type: CashFlowEntryType.CREDIT,
        origin: CashFlowEntryOrigin.BANK_PAYMENT,
        amountInCents: 10000,
        occurredAt: new Date('2026-09-17T12:00:00Z'),
        description: 'Pagamento existente',
        nfseId: nfse.id,
        bankPaymentRequestCode: 'req-1',
      },
    });

    await sut.execute({ nfseId: nfse.id });

    expect(bankPaymentGateway.findCalls).toHaveLength(0);
    expect(await prisma.cashFlowEntry.count({ where: { nfseId: nfse.id } })).toBe(1);
  });

  it('should propagate ExternalApiError when the GET fails', async() => {
    // Arrange
    const nfse = await seedNfse(moduleRef, prisma);
    bankPaymentGateway.findError = new ExternalApiError('Banco Inter indisponível.');

    // Act & Assert
    await expect(sut.execute({ nfseId: nfse.id })).rejects.toThrow(ExternalApiError);
  });
});
