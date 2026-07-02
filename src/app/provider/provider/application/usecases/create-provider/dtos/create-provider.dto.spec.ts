import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateProviderInputDto } from './create-provider.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateProviderInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

function makeValidInput(overrides: Partial<CreateProviderInputDto> = {}): CreateProviderInputDto {
  return {
    name: 'Prestador LTDA',
    document: '09.748.165/0001-10',
    ie: null,
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

describe('CreateProviderInputDto - Unit tests', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should validate input with required fields', async() => {
    const result = await target.transform(makeValidInput(), metadata);

    expect(result.name).toBe('Prestador LTDA');
    expect(result.document).toBe('09.748.165/0001-10');
    expect(result.email).toBe('contato@prestador.com');
  });

  it('should throw when name is empty', async() => {
    const data = makeValidInput({ name: '' });

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'name');
    });
  });

  it('should trim name', async() => {
    const result = await target.transform(makeValidInput({ name: '  Prestador LTDA  ' }), metadata);

    expect(result.name).toBe('Prestador LTDA');
  });
});
