import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { BankPaymentPersonType } from 'src/infra/bank-payment/enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { FindBankPayment } from './find-bank-payment.service';

describe('FindBankPayment - Unit tests', () => {
  let sut: FindBankPayment;
  let gateway: IBankPaymentGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindBankPayment,
        {
          provide: TOKENS.BankPaymentGateway,
          useValue: createMock<IBankPaymentGateway>(),
        },
      ],
    }).compile();

    sut = module.get(FindBankPayment);
    gateway = module.get(TOKENS.BankPaymentGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call gateway.find with provider and requestCode', async() => {
    const findSpy = jest.spyOn(gateway, 'find').mockResolvedValue({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-1',
      yourNumber: 'INV-1',
      status: BankPaymentStatus.EMITTED,
      amount: 10,
      dueDate: '2026-09-01',
      payer: {
        document: '1',
        personType: BankPaymentPersonType.INDIVIDUAL,
        name: 'A',
      },
    });

    await sut.execute('req-1', BankPaymentProvider.INTER);

    expect(findSpy).toHaveBeenCalledWith({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-1',
    });
  });
});
