import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditClientItemInputDto } from './edit-client-item.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditClientItemInputDto,
};

describe('EditClientItemInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should pass with empty object (all fields optional)', async() => {
    const data = {};

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditClientItemInputDto);
    expect(result).toEqual({});
  });

  describe('description', () => {
    it('should accept valid description', async() => {
      const data = { description: 'Descrição editada' };

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Descrição editada');
    });

    it('should trim description', async() => {
      const data = { description: '  Descrição editada  ' };

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Descrição editada');
    });

    it('should throw an error if description exceeds 255 characters', async() => {
      const data = { description: 'a'.repeat(256) };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('description deve ter no máximo 255 caracteres');
      });
    });

    it.each([123, true, false, {}, []])(
      'should throw an error if description is not a string (%s)',
      async(value: unknown) => {
        const data = { description: value };

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('description deve ser uma string');
        });
      },
    );
  });

  describe('quantity', () => {
    it('should accept valid quantity', async() => {
      const data = { quantity: 5 };

      const result = await target.transform(data, metadata);

      expect(result.quantity).toBe(5);
    });

    it('should accept quantity zero', async() => {
      const data = { quantity: 0 };

      const result = await target.transform(data, metadata);

      expect(result.quantity).toBe(0);
    });

    it('should transform string quantity to number', async() => {
      const data = { quantity: '10' };

      const result = await target.transform(data, metadata);

      expect(result.quantity).toBe(10);
    });

    it('should throw an error if quantity is not an integer', async() => {
      const data = { quantity: 1.5 };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('quantity deve ser um número inteiro');
      });
    });

    it('should throw an error if quantity is negative', async() => {
      const data = { quantity: -1 };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('quantity deve ser maior ou igual a zero');
      });
    });
  });

  describe('unitValueInCents', () => {
    it('should accept valid unitValueInCents', async() => {
      const data = { unitValueInCents: 15000 };

      const result = await target.transform(data, metadata);

      expect(result.unitValueInCents).toBe(15000);
    });

    it('should accept unitValueInCents zero', async() => {
      const data = { unitValueInCents: 0 };

      const result = await target.transform(data, metadata);

      expect(result.unitValueInCents).toBe(0);
    });

    it('should transform string unitValueInCents to number', async() => {
      const data = { unitValueInCents: '5000' };

      const result = await target.transform(data, metadata);

      expect(result.unitValueInCents).toBe(5000);
    });

    it('should throw an error if unitValueInCents is not an integer', async() => {
      const data = { unitValueInCents: 99.99 };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('unitValueInCents deve ser um número inteiro');
      });
    });

    it('should throw an error if unitValueInCents is negative', async() => {
      const data = { unitValueInCents: -100 };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('unitValueInCents deve ser maior ou igual a zero');
      });
    });
  });

  describe('cnaeNbsIndopId', () => {
    it('should accept valid cnaeNbsIndopId', async() => {
      const data = { cnaeNbsIndopId: 7 };

      const result = await target.transform(data, metadata);

      expect(result.cnaeNbsIndopId).toBe(7);
    });

    it('should trim cnaeNbsIndopId string to number', async() => {
      const data = { cnaeNbsIndopId: '  42  ' };

      const result = await target.transform(data, metadata);

      expect(result.cnaeNbsIndopId).toBe(42);
    });

    it('should throw an error if cnaeNbsIndopId is not an integer', async() => {
      const data = { cnaeNbsIndopId: 1.5 };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('cnaeNbsIndopId deve ser um número inteiro');
      });
    });
  });

  it('should pass with all fields provided', async() => {
    const data = {
      description: 'Descrição editada',
      quantity: 3,
      unitValueInCents: 20000,
      cnaeNbsIndopId: 1,
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditClientItemInputDto);
    expect(result).toEqual(data);
  });

  it('should pass with partial fields (only some provided)', async() => {
    const data = {
      description: 'Nova descrição',
      quantity: 2,
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditClientItemInputDto);
    expect(result.description).toBe('Nova descrição');
    expect(result.quantity).toBe(2);
    expect(result.unitValueInCents).toBeUndefined();
    expect(result.cnaeNbsIndopId).toBeUndefined();
  });

  it('should not include clientId (omitted from DTO)', async() => {
    const data = {
      description: 'Descrição teste',
      quantity: 1,
    };

    const result = await target.transform(data, metadata);

    expect(result).not.toHaveProperty('clientId');
  });
});
