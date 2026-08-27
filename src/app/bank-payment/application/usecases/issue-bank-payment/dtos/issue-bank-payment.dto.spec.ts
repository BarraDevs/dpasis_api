import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { BankPaymentPersonType } from 'src/infra/bank-payment/enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { IssueBankPaymentInputDto } from './issue-bank-payment.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: IssueBankPaymentInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some(m => m.includes(substring))).toBe(true);
}

function makeValidInput(overrides: Partial<IssueBankPaymentInputDto> = {}): IssueBankPaymentInputDto {
  return {
    provider: BankPaymentProvider.INTER,
    yourNumber: 'INV-1',
    amount: 150.5,
    dueDate: '2026-09-01',
    daysAfterDue: 30,
    payer: {
      document: '11122233344',
      personType: BankPaymentPersonType.INDIVIDUAL,
      name: 'João da Silva',
    },
    ...overrides,
  };
}

describe('IssueBankPaymentInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept a valid input', async() => {
    const result = await target.transform(makeValidInput(), metadata);
    expect(result.yourNumber).toBe('INV-1');
    expect(result.payer.name).toBe('João da Silva');
  });

  it('should reject missing payer name', async() => {
    expect.assertions(1);
    return target.transform(makeValidInput({
      payer: {
        document: '11122233344',
        personType: BankPaymentPersonType.INDIVIDUAL,
        name: '',
      },
    }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'name');
    });
  });

  it('should reject invalid dueDate format', async() => {
    expect.assertions(1);
    return target.transform(makeValidInput({ dueDate: '01/09/2026' }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'dueDate');
    });
  });

  it('should reject invalid provider', async() => {
    expect.assertions(1);
    return target.transform(makeValidInput({ provider: 'OTHER' as BankPaymentProvider }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'provider');
    });
  });
});
