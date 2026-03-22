import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateServiceBilledInputDto } from './create-service-billed.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateServiceBilledInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

function makeValidData(overrides?: Partial<CreateServiceBilledInputDto>): CreateServiceBilledInputDto {
  return {
    description: 'Descrição do serviço faturado',
    isJunction: false,
    installmentDays: [5, 15, 25],
    ...overrides,
  };
}

describe('CreateServiceBilledInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('description', () => {
    it.each([undefined, null, '', '   '])(
      'should throw if description is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ description: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'description');
        });
      },
    );

    it('should throw if description is not a string', async() => {
      const data = makeValidData({ description: 123 as unknown as string });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'description');
      });
    });

    it('should throw if description exceeds 8192 characters', async() => {
      const data = makeValidData({ description: 'a'.repeat(8193) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'description');
      });
    });

    it('should accept description with 8192 characters', async() => {
      const desc = 'a'.repeat(8192);
      const data = makeValidData({ description: desc });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe(desc);
    });

    it('should trim description', async() => {
      const data = makeValidData({ description: '  Descrição com espaços  ' });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Descrição com espaços');
    });

    it('should accept valid description', async() => {
      const data = makeValidData({ description: 'Manutenção mensal' });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Manutenção mensal');
    });
  });

  describe('isJunction', () => {
    it.each([undefined, null])(
      'should throw if isJunction is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ isJunction: value as boolean });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'isJunction');
        });
      },
    );

    it('should throw if isJunction is not boolean', async() => {
      const data = makeValidData({ isJunction: 'yes' as unknown as boolean });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'isJunction');
      });
    });

    it('should transform string "true" to boolean true', async() => {
      const data = { ...makeValidData(), isJunction: 'true' as unknown as boolean };

      const result = await target.transform(data, metadata);

      expect(result.isJunction).toBe(true);
    });

    it('should transform string "false" to boolean false', async() => {
      const data = { ...makeValidData(), isJunction: 'false' as unknown as boolean };

      const result = await target.transform(data, metadata);

      expect(result.isJunction).toBe(false);
    });

    it('should accept isJunction true', async() => {
      const data = makeValidData({ isJunction: true });

      const result = await target.transform(data, metadata);

      expect(result.isJunction).toBe(true);
    });

    it('should accept isJunction false', async() => {
      const data = makeValidData({ isJunction: false });

      const result = await target.transform(data, metadata);

      expect(result.isJunction).toBe(false);
    });
  });

  describe('installmentDays', () => {
    it.each([undefined, null])(
      'should throw if installmentDays is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ installmentDays: value as number[] });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'installmentDays');
        });
      },
    );

    it('should throw if installmentDays is not an array', async() => {
      const data = makeValidData({ installmentDays: 'invalid' as unknown as number[] });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'installmentDays');
      });
    });

    it('should throw if installmentDays contains negative number', async() => {
      const data = makeValidData({ installmentDays: [5, -1, 25] });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'installmentDays');
      });
    });

    it('should throw if installmentDays contains decimal number', async() => {
      const data = makeValidData({ installmentDays: [5, 15.5, 25] });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'installmentDays');
      });
    });

    it('should accept empty installmentDays array', async() => {
      const data = makeValidData({ installmentDays: [] });

      const result = await target.transform(data, metadata);

      expect(result.installmentDays).toEqual([]);
    });

    it('should accept installmentDays with single element', async() => {
      const data = makeValidData({ installmentDays: [30] });

      const result = await target.transform(data, metadata);

      expect(result.installmentDays).toEqual([30]);
    });

    it('should accept installmentDays with zero', async() => {
      const data = makeValidData({ installmentDays: [0, 15, 30] });

      const result = await target.transform(data, metadata);

      expect(result.installmentDays).toEqual([0, 15, 30]);
    });

    it('should accept valid installmentDays', async() => {
      const data = makeValidData({ installmentDays: [5, 15, 25] });

      const result = await target.transform(data, metadata);

      expect(result.installmentDays).toEqual([5, 15, 25]);
    });
  });

  describe('all fields validation', () => {
    it('should pass if all fields are valid', async() => {
      const data = makeValidData();

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(CreateServiceBilledInputDto);
      expect(result.description).toBe('Descrição do serviço faturado');
      expect(result.isJunction).toBe(false);
      expect(result.installmentDays).toEqual([5, 15, 25]);
    });

    it('should pass with isJunction true and empty installmentDays', async() => {
      const data = makeValidData({
        description: 'Junção',
        isJunction: true,
        installmentDays: [],
      });

      const result = await target.transform(data, metadata);

      expect(result.isJunction).toBe(true);
      expect(result.installmentDays).toEqual([]);
    });
  });
});
