import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentModule } from '../../../bank-payment.module';
import { FindAllBankPayment } from './find-all-bank-payment.service';

describe('FindAllBankPayment - Integration tests', () => {
  let sut: FindAllBankPayment;
  let gateway: BankPaymentFakeAdapterGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [BankPaymentModule],
    }).compile();

    sut = module.get(FindAllBankPayment);
    gateway = module.get(TOKENS.BankPaymentGateway) as BankPaymentFakeAdapterGateway;
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should list via fake gateway', async() => {
    const result = await sut.execute({
      provider: BankPaymentProvider.INTER,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      page: 1,
      size: 10,
    });

    expect(gateway.listCalls).toEqual([{
      provider: BankPaymentProvider.INTER,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      status: undefined,
      payerName: undefined,
      payerDocument: undefined,
      page: 1,
      size: 10,
    }]);
    expect(result.totalItems).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].requestCode).toBe('fake-request-code');
  });
});
