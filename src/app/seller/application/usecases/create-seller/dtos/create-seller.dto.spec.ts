import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateSellerInputDto } from './create-seller.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateSellerInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

function makeValidInputDto(overrides: Partial<CreateSellerInputDto> = {}): CreateSellerInputDto {
  return {
    name: 'João Silva',
    phone: '1133334444',
    nickname: 'João',
    whatsapp: '11999998888',
    email: 'joao@vendedor.com',
    commission: 10.5,
    profilePictureUrl: null,
    observation: null,
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

describe('CreateSellerInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('name field', () => {
    it.each([undefined, null, '', '  '])('should throw if name is empty (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ name: value as string });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'name');
      });
    });
  });

  describe('email field', () => {
    it('should throw if email is invalid', async() => {
      const data = makeValidInputDto({ email: 'invalid' });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'email');
      });
    });
  });

  describe('commission field', () => {
    it('should throw if commission is above 100', async() => {
      const data = makeValidInputDto({ commission: 101 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'commission');
      });
    });

    it('should throw if commission is below 0', async() => {
      const data = makeValidInputDto({ commission: -1 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'commission');
      });
    });
  });

  it('should pass validation with valid input', async() => {
    const data = makeValidInputDto();

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(CreateSellerInputDto);
    expect(result.name).toBe('João Silva');
  });
});
