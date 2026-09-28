import { Test, TestingModule } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { seedConfiguredBank } from 'src/test/fixtures/seed-configured-bank';
import { BankPaymentModule } from '../../../bank-payment.module';
import { GetBankPaymentPdf } from './get-bank-payment-pdf.service';

describe('GetBankPaymentPdf - Integration tests', () => {
  let sut: GetBankPaymentPdf;
  let gateway: BankPaymentFakeAdapterGateway;
  let prisma: PrismaService;
  let moduleRef: TestingModule;
  let bankId: number;

  beforeAll(async() => {
    moduleRef = await Test.createTestingModule({
      imports: [BankPaymentModule],
    }).compile();
    sut = moduleRef.get(GetBankPaymentPdf);
    gateway = moduleRef.get(TOKENS.BankPaymentGateway) as BankPaymentFakeAdapterGateway;
    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
    gateway.getPdfCalls.length = 0;
    ({ bankId } = await seedConfiguredBank(moduleRef));
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should get PDF via fake gateway with resolved credentials', async() => {
    const result = await sut.execute('req-abc', BankPaymentProvider.INTER, bankId);

    expect(gateway.getPdfCalls).toHaveLength(1);
    expect(gateway.getPdfCalls[0].credentials.bankId).toBe(bankId);
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-abc',
      pdf: 'JVBERi0xLjQK',
    });
  });
});
