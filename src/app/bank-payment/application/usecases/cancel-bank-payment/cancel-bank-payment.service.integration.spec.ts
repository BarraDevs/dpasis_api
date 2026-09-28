import { Test, TestingModule } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { seedConfiguredBank } from 'src/test/fixtures/seed-configured-bank';
import { BankPaymentModule } from '../../../bank-payment.module';
import { CancelBankPayment } from './cancel-bank-payment.service';

describe('CancelBankPayment - Integration tests', () => {
  let sut: CancelBankPayment;
  let gateway: BankPaymentFakeAdapterGateway;
  let prisma: PrismaService;
  let moduleRef: TestingModule;
  let bankId: number;

  beforeAll(async() => {
    moduleRef = await Test.createTestingModule({
      imports: [BankPaymentModule],
    }).compile();
    sut = moduleRef.get(CancelBankPayment);
    gateway = moduleRef.get(TOKENS.BankPaymentGateway) as BankPaymentFakeAdapterGateway;
    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
    gateway.cancelCalls.length = 0;
    ({ bankId } = await seedConfiguredBank(moduleRef));
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should cancel via fake gateway with resolved credentials', async() => {
    const result = await sut.execute('req-abc', {
      provider: BankPaymentProvider.INTER,
      bankId,
      reason: 'Cliente pediu o cancelamento',
    });

    expect(gateway.cancelCalls).toHaveLength(1);
    expect(gateway.cancelCalls[0].credentials.bankId).toBe(bankId);
    expect(result.message).toBe('Cobrança bancária cancelada com sucesso.');
  });
});
