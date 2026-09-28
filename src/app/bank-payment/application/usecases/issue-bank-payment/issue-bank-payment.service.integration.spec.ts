import { Test, TestingModule } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentPersonType } from 'src/infra/bank-payment/enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { seedConfiguredBank } from 'src/test/fixtures/seed-configured-bank';
import { BankPaymentModule } from '../../../bank-payment.module';
import { IssueBankPayment } from './issue-bank-payment.service';

describe('IssueBankPayment - Integration tests', () => {
  let sut: IssueBankPayment;
  let gateway: BankPaymentFakeAdapterGateway;
  let prisma: PrismaService;
  let moduleRef: TestingModule;
  let bankId: number;

  beforeAll(async() => {
    moduleRef = await Test.createTestingModule({
      imports: [BankPaymentModule],
    }).compile();
    sut = moduleRef.get(IssueBankPayment);
    gateway = moduleRef.get(TOKENS.BankPaymentGateway) as BankPaymentFakeAdapterGateway;
    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
    gateway.issueCalls.length = 0;
    ({ bankId } = await seedConfiguredBank(moduleRef));
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should issue via fake gateway with resolved credentials', async() => {
    const result = await sut.execute({
      bankId,
      provider: BankPaymentProvider.INTER,
      yourNumber: 'INV-1',
      amount: 10,
      dueDate: '2026-09-01',
      daysAfterDue: 30,
      payer: {
        document: '11122233344',
        personType: BankPaymentPersonType.INDIVIDUAL,
        name: 'João',
      },
    });

    expect(gateway.issueCalls).toHaveLength(1);
    expect(gateway.issueCalls[0].credentials.bankId).toBe(bankId);
    expect(result.requestCode).toBe('fake-request-code');
  });
});
