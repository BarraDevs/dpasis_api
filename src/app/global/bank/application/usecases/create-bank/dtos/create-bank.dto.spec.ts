import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateBankInputDto } from './create-bank.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateBankInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some(m => m.includes(substring))).toBe(true);
}

function makeValidInput(overrides: Partial<CreateBankInputDto> = {}): CreateBankInputDto {
  return {
    drawer: 'Empresa XYZ Ltda',
    wallet: '123',
    account: '12345-6',
    agency: '0001',
    bankCode: '001',
    bankName: 'Banco do Brasil',
    paymentLocation: null,
    ...overrides,
  };
}

describe('CreateBankInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept a valid input without charge fields', async() => {
    const result = await target.transform(makeValidInput(), metadata);
    expect(result.bankName).toBe('Banco do Brasil');
    expect(result.fineRate).toBeUndefined();
    expect(result.moraRate).toBeUndefined();
  });

  it('should accept fineRate and moraRate', async() => {
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

  it('should reject negative fineRate', async() => {
    expect.assertions(1);
    return target.transform(makeValidInput({ fineRate: -1 }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'fineRate');
    });
  });

  it('should accept fineRate and moraRate at 0 and 100', async() => {
    // Arrange / Act
    const min = await target.transform(makeValidInput({ fineRate: 0, moraRate: 0 }), metadata);
    const max = await target.transform(makeValidInput({ fineRate: 100, moraRate: 100 }), metadata);

    // Assert
    expect(min.fineRate).toBe(0);
    expect(min.moraRate).toBe(0);
    expect(max.fineRate).toBe(100);
    expect(max.moraRate).toBe(100);
  });

  it('should reject fineRate with more than 2 decimal places', async() => {
    expect.assertions(1);
    return target.transform(makeValidInput({ fineRate: 2.001 }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'fineRate deve ser um número com até 2 casas decimais');
    });
  });

  it('should reject negative moraRate', async() => {
    expect.assertions(1);
    return target.transform(makeValidInput({ moraRate: -1 }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'moraRate');
    });
  });

  it('should accept optional Inter credentials', async() => {
    const result = await target.transform(makeValidInput({
      apiUrl: 'https://cdpj.partners.bancointer.com.br',
      clientId: 'inter-client-id',
      clientSecret: 'inter-client-secret',
      webhookToken: 'token-do-webhook-16',
    }), metadata);

    expect(result.apiUrl).toBe('https://cdpj.partners.bancointer.com.br');
    expect(result.webhookToken).toBe('token-do-webhook-16');
  });

  it('should reject webhookToken shorter than 16 characters', async() => {
    expect.assertions(1);
    return target.transform(makeValidInput({ webhookToken: 'short' }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'webhookToken');
    });
  });
});
