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

  it('should accept optional charge fields', async() => {
    const result = await target.transform(makeValidInput({
      fineRate: 2,
      moraRate: 1,
    }), metadata);

    expect(result.fineRate).toBe(2);
    expect(result.moraRate).toBe(1);
  });

  it('should reject fineRate greater than 100', async() => {
    expect.assertions(1);
    return target.transform(makeValidInput({ fineRate: 101 }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'fineRate');
    });
  });

  it('should reject moraRate greater than 100', async() => {
    expect.assertions(1);
    return target.transform(makeValidInput({ moraRate: 101 }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'moraRate');
    });
  });

  it('should reject fineRate with more than 2 decimal places', async() => {
    expect.assertions(1);
    return target.transform(makeValidInput({ fineRate: 2.001 }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'fineRate deve ser um número com até 2 casas decimais');
    });
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

  describe('nfseId', () => {
    it('should accept when nfseId is omitted', async() => {
      const result = await target.transform(makeValidInput(), metadata);
      expect(result.nfseId).toBeUndefined();
    });

    it('should accept a positive nfseId', async() => {
      const result = await target.transform(makeValidInput({ nfseId: 1 }), metadata);
      expect(result.nfseId).toBe(1);
    });

    it.each([0, -1])('should reject non-positive nfseId (%s)', async(value: number) => {
      expect.assertions(1);
      return target.transform(makeValidInput({ nfseId: value }), metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'nfseId');
      });
    });
  });
});
