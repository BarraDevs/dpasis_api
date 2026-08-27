import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentModule } from '../../../bank-payment.module';
import { CancelBankPayment } from './cancel-bank-payment.service';

describe('CancelBankPayment - Integration tests', () => {
  let sut: CancelBankPayment;
  let gateway: BankPaymentFakeAdapterGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [BankPaymentModule],
    }).compile();

    sut = module.get(CancelBankPayment);
    gateway = module.get(TOKENS.BankPaymentGateway) as BankPaymentFakeAdapterGateway;
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should cancel via fake gateway', async() => {
    const result = await sut.execute('req-abc', {
      provider: BankPaymentProvider.INTER,
      reason: 'Cliente pediu o cancelamento',
    });

    expect(gateway.cancelCalls).toEqual([{
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-abc',
      reason: 'Cliente pediu o cancelamento',
    }]);
    expect(result.message).toBe('Cobrança bancária cancelada com sucesso.');
  });
});
