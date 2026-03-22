import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditServiceBilledInputDto } from './edit-service-billed.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditServiceBilledInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

describe('EditServiceBilledInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('optional fields', () => {
    it('should accept empty object (all fields optional)', async() => {
      const data = {};

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(EditServiceBilledInputDto);
    });

    it('should accept partial update with description only', async() => {
      const data = { description: 'Nova descrição' };

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Nova descrição');
    });

    it('should accept partial update with isJunction only', async() => {
      const data = { isJunction: true };

      const result = await target.transform(data, metadata);

      expect(result.isJunction).toBe(true);
    });

    it('should accept partial update with installmentDays only', async() => {
      const data = { installmentDays: [10, 20, 30] };

      const result = await target.transform(data, metadata);

      expect(result.installmentDays).toEqual([10, 20, 30]);
    });

    it('should accept partial update with multiple fields', async() => {
      const data = {
        description: 'Descrição atualizada',
        isJunction: true,
        installmentDays: [5, 15, 25, 30],
      };

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Descrição atualizada');
      expect(result.isJunction).toBe(true);
      expect(result.installmentDays).toEqual([5, 15, 25, 30]);
    });
  });

  describe('description - when provided', () => {
    it('should throw if description is empty string when provided', async() => {
      const data = { description: '' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'description');
      });
    });

    it('should throw if description is only whitespace when provided', async() => {
      const data = { description: '   ' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'description');
      });
    });

    it('should throw if description exceeds 8192 characters when provided', async() => {
      const data = { description: 'a'.repeat(8193) };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'description');
      });
    });

    it('should trim description when provided', async() => {
      const data = { description: '  Descrição editada  ' };

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Descrição editada');
    });

    it('should accept valid description when provided', async() => {
      const data = { description: 'Manutenção editada' };

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Manutenção editada');
    });
  });

  describe('isJunction - when provided', () => {
    it('should throw if isJunction is not boolean when provided', async() => {
      const data = { isJunction: 'invalid' as unknown as boolean };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'isJunction');
      });
    });

    it('should transform string "true" to boolean when provided', async() => {
      const data = { isJunction: 'true' as unknown as boolean };

      const result = await target.transform(data, metadata);

      expect(result.isJunction).toBe(true);
    });

    it('should accept valid isJunction when provided', async() => {
      const data = { isJunction: false };

      const result = await target.transform(data, metadata);

      expect(result.isJunction).toBe(false);
    });
  });

  describe('installmentDays - when provided', () => {
    it('should throw if installmentDays is not array when provided', async() => {
      const data = { installmentDays: 'invalid' as unknown as number[] };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'installmentDays');
      });
    });

    it('should throw if installmentDays contains negative number when provided', async() => {
      const data = { installmentDays: [5, -1, 25] };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'installmentDays');
      });
    });

    it('should throw if installmentDays contains decimal when provided', async() => {
      const data = { installmentDays: [5, 15.5, 25] };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'installmentDays');
      });
    });

    it('should accept empty installmentDays when provided', async() => {
      const data = { installmentDays: [] };

      const result = await target.transform(data, metadata);

      expect(result.installmentDays).toEqual([]);
    });

    it('should accept valid installmentDays when provided', async() => {
      const data = { installmentDays: [0, 15, 30] };

      const result = await target.transform(data, metadata);

      expect(result.installmentDays).toEqual([0, 15, 30]);
    });
  });

  describe('full update validation', () => {
    it('should pass if all fields are valid', async() => {
      const data = {
        description: 'Descrição completa',
        isJunction: true,
        installmentDays: [5, 10, 15, 20, 25, 30],
      };

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Descrição completa');
      expect(result.isJunction).toBe(true);
      expect(result.installmentDays).toEqual([5, 10, 15, 20, 25, 30]);
    });

    it('should fail if any provided field is invalid', async() => {
      const data = {
        description: 'Valid',
        isJunction: true,
        installmentDays: [5, -1],
      };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'installmentDays');
      });
    });
  });
});
