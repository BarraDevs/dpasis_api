import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentPersonType } from 'src/infra/bank-payment/enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentModule } from '../../../bank-payment.module';
import { IssueBankPayment } from './issue-bank-payment.service';

describe('IssueBankPayment - Integration tests', () => {
  let sut: IssueBankPayment;
  let gateway: BankPaymentFakeAdapterGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [BankPaymentModule],
    }).compile();

    sut = module.get(IssueBankPayment);
    gateway = module.get(TOKENS.BankPaymentGateway) as BankPaymentFakeAdapterGateway;
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should issue via fake gateway', async() => {
    const result = await sut.execute({
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
    expect(result.requestCode).toBe('fake-request-code');
  });
});
