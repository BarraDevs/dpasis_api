import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { CreateProviderInputDto } from './create-provider.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateProviderInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

function makeValidOneOffInput(overrides: Partial<CreateProviderInputDto> = {}): CreateProviderInputDto {
  return {
    name: 'Prestador LTDA',
    type: ProviderType.ONE_OFF,
    valueInCents: 150000,
    document: '09.748.165/0001-10',
    ie: null,
    deadline: 30,
    fantasyName: 'Prestador',
    email: 'contato@prestador.com',
    website: 'https://prestador.com',
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    ...overrides,
  };
}

function makeValidRecurringInput(overrides: Partial<CreateProviderInputDto> = {}): CreateProviderInputDto {
  return {
    ...makeValidOneOffInput(),
    type: ProviderType.RECURRING,
    paymentDate: 15,
    deadline: undefined,
    ...overrides,
  };
}

describe('CreateProviderInputDto - Unit tests', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should validate ONE_OFF input with deadline', async() => {
    const result = await target.transform(makeValidOneOffInput(), metadata);

    expect(result.type).toBe(ProviderType.ONE_OFF);
    expect(result.deadline).toBe(30);
  });

  it('should validate RECURRING input with paymentDate', async() => {
    const result = await target.transform(makeValidRecurringInput(), metadata);

    expect(result.type).toBe(ProviderType.RECURRING);
    expect(result.paymentDate).toBe(15);
  });

  it('should throw when ONE_OFF without deadline', async() => {
    const data = makeValidOneOffInput({ deadline: undefined });

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'deadline');
    });
  });

  it('should throw when RECURRING without paymentDate', async() => {
    const data = makeValidRecurringInput({ paymentDate: undefined });

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'paymentDate');
    });
  });

  it('should throw when paymentDate is out of range for RECURRING', async() => {
    const data = makeValidRecurringInput({ paymentDate: 32 });

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'paymentDate');
    });
  });

  it('should trim name', async() => {
    const result = await target.transform(makeValidOneOffInput({ name: '  Prestador LTDA  ' }), metadata);

    expect(result.name).toBe('Prestador LTDA');
  });
});
