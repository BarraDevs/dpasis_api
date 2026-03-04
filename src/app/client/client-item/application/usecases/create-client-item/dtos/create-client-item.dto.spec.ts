import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateClientItemInputDto } from './create-client-item.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateClientItemInputDto,
};

function makeValidData(overrides?: Partial<CreateClientItemInputDto>) {
  return {
    clientId: 1,
    description: 'Descrição do item',
    quantity: 1,
    unitValueInCents: 10000,
    cnaeNbsIndopId: 1,
    ...overrides,
  };
}

describe('CreateClientItemInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('clientId', () => {
    it.each([undefined, null, '', '   '])(
      'should throw an error if clientId is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ clientId: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('clientId é obrigatório');
        });
      },
    );

    it('should throw an error if clientId is not an integer', async() => {
      const data = makeValidData({ clientId: 1.5 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('clientId deve ser um número inteiro');
      });
    });

    it('should transform string clientId to number', async() => {
      const data = { ...makeValidData(), clientId: '42' };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(42);
    });
  });

  describe('description', () => {
    it.each([undefined, null, '', '   '])(
      'should throw an error if description is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ description: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('description é obrigatório');
        });
      },
    );

    it.each([123, true, false, {}, []])(
      'should throw an error if description is not a string (%s)',
      async(value: unknown) => {
        const data = makeValidData({ description: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('description deve ser uma string');
        });
      },
    );

    it('should throw an error if description exceeds 255 characters', async() => {
      const data = makeValidData({ description: 'a'.repeat(256) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('description deve ter no máximo 255 caracteres');
      });
    });

    it('should trim description', async() => {
      const data = makeValidData({ description: '  Descrição do item  ' });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Descrição do item');
    });
  });

  describe('quantity', () => {
    it.each([undefined, null, ''])(
      'should throw an error if quantity is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ quantity: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('quantity é obrigatório');
        });
      },
    );

    it('should throw an error if quantity is not an integer', async() => {
      const data = makeValidData({ quantity: 1.5 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('quantity deve ser um número inteiro');
      });
    });

    it('should throw an error if quantity is negative', async() => {
      const data = makeValidData({ quantity: -1 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('quantity deve ser maior ou igual a zero');
      });
    });

    it('should accept quantity zero', async() => {
      const data = makeValidData({ quantity: 0 });

      const result = await target.transform(data, metadata);

      expect(result.quantity).toBe(0);
    });

    it('should transform string quantity to number', async() => {
      const data = { ...makeValidData(), quantity: '10' };

      const result = await target.transform(data, metadata);

      expect(result.quantity).toBe(10);
    });
  });

  describe('unitValueInCents', () => {
    it.each([undefined, null, ''])(
      'should throw an error if unitValueInCents is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ unitValueInCents: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('unitValueInCents é obrigatório');
        });
      },
    );

    it('should throw an error if unitValueInCents is not an integer', async() => {
      const data = makeValidData({ unitValueInCents: 99.99 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('unitValueInCents deve ser um número inteiro');
      });
    });

    it('should throw an error if unitValueInCents is negative', async() => {
      const data = makeValidData({ unitValueInCents: -100 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('unitValueInCents deve ser maior ou igual a zero');
      });
    });

    it('should accept unitValueInCents zero', async() => {
      const data = makeValidData({ unitValueInCents: 0 });

      const result = await target.transform(data, metadata);

      expect(result.unitValueInCents).toBe(0);
    });

    it('should transform string unitValueInCents to number', async() => {
      const data = { ...makeValidData(), unitValueInCents: '5000' };

      const result = await target.transform(data, metadata);

      expect(result.unitValueInCents).toBe(5000);
    });
  });

  describe('cnaeNbsIndopId', () => {
    it.each([undefined, null, '', '   '])(
      'should throw an error if cnaeNbsIndopId is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ cnaeNbsIndopId: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('cnaeNbsIndopId é obrigatório');
        });
      },
    );

    it('should throw an error if cnaeNbsIndopId is not an integer', async() => {
      const data = makeValidData({ cnaeNbsIndopId: 1.5 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('cnaeNbsIndopId deve ser um número inteiro');
      });
    });

    it('should transform string cnaeNbsIndopId to number', async() => {
      const data = { ...makeValidData(), cnaeNbsIndopId: '42' };

      const result = await target.transform(data, metadata);

      expect(result.cnaeNbsIndopId).toBe(42);
    });
  });

  it('should pass if all required fields are valid', async() => {
    const data = makeValidData();

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(CreateClientItemInputDto);
    expect(result.clientId).toBe(1);
    expect(result.description).toBe('Descrição do item');
    expect(result.quantity).toBe(1);
    expect(result.unitValueInCents).toBe(10000);
    expect(result.cnaeNbsIndopId).toBe(1);
  });

  it('should accept boundary value for description', async() => {
    const data = makeValidData({
      description: 'a'.repeat(255),
    });

    const result = await target.transform(data, metadata);

    expect(result.description).toBe('a'.repeat(255));
  });
});
