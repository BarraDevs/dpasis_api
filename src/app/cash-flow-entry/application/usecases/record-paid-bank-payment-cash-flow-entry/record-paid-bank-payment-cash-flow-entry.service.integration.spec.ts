import { Test } from '@nestjs/testing';
import { CashFlowEntryModule } from 'src/app/cash-flow-entry/cash-flow-entry.module';
import { CashFlowEntryOrigin } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-origin.enum';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { RecordPaidBankPaymentCashFlowEntry } from './record-paid-bank-payment-cash-flow-entry.service';

describe('RecordPaidBankPaymentCashFlowEntry - Integration tests', () => {
  let sut: RecordPaidBankPaymentCashFlowEntry;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CashFlowEntryModule],
    }).compile();

    sut = module.get(RecordPaidBankPaymentCashFlowEntry);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should create a CREDIT linked to the NFS-e and stay idempotent', async() => {
    const company = await prisma.company.create({ data: buildMinimalCompanyData() });
    const nfse = await prisma.nfse.create({
      data: {
        companyId: company.id,
        clientId: 1,
        rpsNumber: 1,
        rpsSeries: 'NFSE',
        status: NfseStatus.ISSUED,
        data: {},
      },
    });
    const occurredAt = new Date('2026-09-17T12:00:00.000Z');

    const first = await sut.execute({
      companyId: company.id,
      nfseId: nfse.id,
      bankPaymentRequestCode: 'req-1',
      occurredAt,
      amount: 100,
    });
    const second = await sut.execute({
      companyId: company.id,
      nfseId: nfse.id,
      bankPaymentRequestCode: 'req-1',
      occurredAt,
      amount: 100,
    });

    expect(first.id).toBe(second.id);
    expect(await prisma.cashFlowEntry.count()).toBe(1);
    const saved = await prisma.cashFlowEntry.findUnique({ where: { id: first.id! } });
    expect(saved).toEqual(
      expect.objectContaining({
        companyId: company.id,
        type: CashFlowEntryType.CREDIT,
        origin: CashFlowEntryOrigin.BANK_PAYMENT,
        amountInCents: 10000,
        nfseId: nfse.id,
        bankPaymentRequestCode: 'req-1',
      }),
    );
  });
});
