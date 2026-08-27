import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { CancelBankPayment } from './cancel-bank-payment.service';

describe('CancelBankPayment - Unit tests', () => {
  let sut: CancelBankPayment;
  let gateway: IBankPaymentGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CancelBankPayment,
        {
          provide: TOKENS.BankPaymentGateway,
          useValue: createMock<IBankPaymentGateway>(),
        },
      ],
    }).compile();

    sut = module.get(CancelBankPayment);
    gateway = module.get(TOKENS.BankPaymentGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call gateway.cancel and return success message', async() => {
    const cancelSpy = jest.spyOn(gateway, 'cancel').mockResolvedValue(undefined);

    const result = await sut.execute('req-1', {
      provider: BankPaymentProvider.INTER,
      reason: 'Cliente pediu o cancelamento',
    });

    expect(cancelSpy).toHaveBeenCalledWith({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-1',
      reason: 'Cliente pediu o cancelamento',
    });
    expect(result).toEqual({ message: 'Cobrança bancária cancelada com sucesso.' });
  });
});
