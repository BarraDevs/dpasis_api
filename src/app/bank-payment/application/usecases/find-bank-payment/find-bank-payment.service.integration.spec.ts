import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentModule } from '../../../bank-payment.module';
import { FindBankPayment } from './find-bank-payment.service';

describe('FindBankPayment - Integration tests', () => {
  let sut: FindBankPayment;
  let gateway: BankPaymentFakeAdapterGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [BankPaymentModule],
    }).compile();

    sut = module.get(FindBankPayment);
    gateway = module.get(TOKENS.BankPaymentGateway) as BankPaymentFakeAdapterGateway;
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should find via fake gateway', async() => {
    const result = await sut.execute('req-abc', BankPaymentProvider.INTER);

    expect(gateway.findCalls).toEqual([{
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-abc',
    }]);
    expect(result.requestCode).toBe('req-abc');
  });
});
