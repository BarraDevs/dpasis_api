import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { BankPaymentPersonType } from 'src/infra/bank-payment/enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { IssueBankPaymentInputDto } from './dtos/issue-bank-payment.dto';
import { IssueBankPayment } from './issue-bank-payment.service';

function makeValidInput(overrides: Partial<IssueBankPaymentInputDto> = {}): IssueBankPaymentInputDto {
  return {
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
    ...overrides,
  };
}

describe('IssueBankPayment - Unit tests', () => {
  let sut: IssueBankPayment;
  let gateway: IBankPaymentGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        IssueBankPayment,
        {
          provide: TOKENS.BankPaymentGateway,
          useValue: createMock<IBankPaymentGateway>(),
        },
      ],
    }).compile();

    sut = module.get(IssueBankPayment);
    gateway = module.get(TOKENS.BankPaymentGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call gateway.issue and return result', async() => {
    const input = makeValidInput();
    const issueSpy = jest.spyOn(gateway, 'issue').mockResolvedValue({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-1',
    });

    const result = await sut.execute(input);

    expect(issueSpy).toHaveBeenCalledWith(input);
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-1',
    });
  });
});
