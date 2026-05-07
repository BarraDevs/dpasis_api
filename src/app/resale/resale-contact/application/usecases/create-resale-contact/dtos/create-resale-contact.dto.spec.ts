import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateResaleContactInputDto } from './create-resale-contact.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateResaleContactInputDto,
};

function makeValidInputDto(overrides: Partial<CreateResaleContactInputDto> = {}): CreateResaleContactInputDto {
  return {
    resaleId: '1',
    name: 'João Silva',
    departmentId: 1,
    email: 'joao@example.com',
    receiveNF: false,
    phone: null,
    whatsapp: null,
    observations: null,
    ...overrides,
  };
}

describe('CreateResaleContactInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('name field', () => {
    it.each([undefined, null, '', '  '])(
      'should throw an error if name is empty (%s)',
      async(value: unknown) => {
        const data = makeValidInputDto({ name: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('name é obrigatório');
        });
      },
    );

    it('should throw an error if name exceeds 255 characters', async() => {
      const data = makeValidInputDto({ name: 'a'.repeat(256) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('name deve ter no máximo 255 caracteres');
      });
    });

    it('should trim whitespace from name', async() => {
      const data = makeValidInputDto({ name: '  João Silva  ' });

      const result = await target.transform(data, metadata);

      expect(result.name).toBe('João Silva');
    });
  });

  describe('email field', () => {
    it.each([undefined, null, '', '  '])(
      'should throw an error if email is empty (%s)',
      async(value: unknown) => {
        const data = makeValidInputDto({ email: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          const message = error.getResponse().message;
          const msgStr = Array.isArray(message) ? message.join(' ') : message;
          expect(msgStr).toContain('email');
        });
      },
    );

    it('should throw an error if email is invalid', async() => {
      const data = makeValidInputDto({ email: 'invalid-email' });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message;
        const msgStr = Array.isArray(message) ? message.join(' ') : message;
        expect(msgStr).toContain('email');
      });
    });

    it('should accept valid email', async() => {
      const data = makeValidInputDto({ email: 'joao@example.com' });

      const result = await target.transform(data, metadata);

      expect(result.email).toBe('joao@example.com');
    });
  });

  describe('all fields validation', () => {
    it('should pass if all required fields are valid', async() => {
      const data = makeValidInputDto({
        resaleId: '1',
        name: 'João Silva',
        departmentId: 1,
        email: 'joao@example.com',
        receiveNF: false,
      });

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(CreateResaleContactInputDto);
      expect(result.resaleId).toBe('1');
      expect(result.name).toBe('João Silva');
      expect(result.departmentId).toBe(1);
      expect(result.email).toBe('joao@example.com');
      expect(result.receiveNF).toBe(false);
    });

    it('should accept optional fields', async() => {
      const data = makeValidInputDto({
        phone: '11999999999',
        whatsapp: '11988887777',
        observations: 'Observação',
      });

      const result = await target.transform(data, metadata);

      expect(result.phone).toBe('11999999999');
      expect(result.whatsapp).toBe('11988887777');
      expect(result.observations).toBe('Observação');
    });

    it('should reject invalid resaleId hex', async() => {
      const data = makeValidInputDto({ resaleId: 'ZZ' });

      await expect(target.transform(data, metadata)).rejects.toBeDefined();
    });
  });
});
