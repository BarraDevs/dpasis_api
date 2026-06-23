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

    it('should trim whitespace', async() => {
      const result = await target.transform(makeValidInputDto({ name: '  João Silva  ' }), metadata);

      expect(result.name).toBe('João Silva');
    });
  });

  describe('phone field', () => {
    it.each([undefined, null, '', '  '])('should throw if phone is empty (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ phone: value as string });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'phone');
      });
    });
  });

  describe('email field', () => {
    it.each([undefined, null, '', '  '])('should throw if email is empty (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ email: value as string });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'email');
      });
    });

    it('should throw if email is invalid', async() => {
      const data = makeValidInputDto({ email: 'invalid' });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'email');
      });
    });

    it('should trim whitespace', async() => {
      const result = await target.transform(
        makeValidInputDto({ email: '  joao@vendedor.com  ' }),
        metadata,
      );

      expect(result.email).toBe('joao@vendedor.com');
    });
  });

  describe('commission field', () => {
    it('should coerce commission from multipart string', async() => {
      const data = { ...makeValidInputDto(), commission: '15.5' as unknown as number };

      const result = await target.transform(data, metadata);

      expect(result.commission).toBe(15.5);
    });

    it('should accept commission at boundary 0', async() => {
      const result = await target.transform(makeValidInputDto({ commission: 0 }), metadata);

      expect(result.commission).toBe(0);
    });

    it('should accept commission at boundary 100', async() => {
      const result = await target.transform(makeValidInputDto({ commission: 100 }), metadata);

      expect(result.commission).toBe(100);
    });

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
