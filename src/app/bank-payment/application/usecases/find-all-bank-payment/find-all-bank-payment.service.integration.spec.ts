import { Test, TestingModule } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { seedConfiguredBank } from 'src/test/fixtures/seed-configured-bank';
import { BankPaymentModule } from '../../../bank-payment.module';
import { FindAllBankPayment } from './find-all-bank-payment.service';

describe('FindAllBankPayment - Integration tests', () => {
  let sut: FindAllBankPayment;
  let gateway: BankPaymentFakeAdapterGateway;
  let prisma: PrismaService;
  let moduleRef: TestingModule;
  let bankId: number;

  beforeAll(async() => {
    moduleRef = await Test.createTestingModule({
      imports: [BankPaymentModule],
    }).compile();
    sut = moduleRef.get(FindAllBankPayment);
    gateway = moduleRef.get(TOKENS.BankPaymentGateway) as BankPaymentFakeAdapterGateway;
    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
    gateway.listCalls.length = 0;
    ({ bankId } = await seedConfiguredBank(moduleRef));
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should list via fake gateway with resolved credentials', async() => {
    const result = await sut.execute({
      provider: BankPaymentProvider.INTER,
      bankId,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      page: 1,
      size: 10,
    });

    expect(gateway.listCalls).toHaveLength(1);
    expect(gateway.listCalls[0].credentials.bankId).toBe(bankId);
    expect(result.totalItems).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].requestCode).toBe('fake-request-code');
  });
});
