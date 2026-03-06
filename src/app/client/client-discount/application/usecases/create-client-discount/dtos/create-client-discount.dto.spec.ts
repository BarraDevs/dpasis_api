import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { DiscountType } from 'src/app/client/client-discount/domain/enums/discount-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import {
  CreateClientDiscountInputDto,
  CreateClientDiscountOutputDto,
} from './create-client-discount.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateClientDiscountInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

function makeValidData(overrides?: Partial<CreateClientDiscountInputDto>): CreateClientDiscountInputDto {
  return {
    clientId: 1,
    description: 'Desconto de teste',
    type: DiscountType.PERCENTAGE,
    discountValue: 1050,
    month: 3,
    year: 2026,
    doNotGenerateCharge: false,
    terminateContract: false,
    ...overrides,
  };
}

describe('CreateClientDiscountInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('clientId', () => {
    it.each([undefined, null, '', '   '])(
      'should throw if clientId is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ clientId: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'clientId');
        });
      },
    );

    it.each([0, -1])('should throw if clientId is less than 1 (%s)', async(value: number) => {
      const data = makeValidData({ clientId: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'clientId');
      });
    });

    it('should transform string clientId to number', async() => {
      const data = { ...makeValidData(), clientId: '42' as unknown as number };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(42);
    });

    it('should accept valid clientId', async() => {
      const data = makeValidData({ clientId: 100 });

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(100);
    });
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

    it('should throw if description exceeds 1000 characters', async() => {
      const data = makeValidData({ description: 'a'.repeat(1001) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'description');
      });
    });

    it('should accept description with 1000 characters', async() => {
      const desc = 'a'.repeat(1000);
      const data = makeValidData({ description: desc });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe(desc);
    });

    it('should trim description', async() => {
      const data = makeValidData({ description: '  Desconto especial  ' });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Desconto especial');
    });
  });

  describe('type', () => {
    it.each([undefined, null, '', '   '])(
      'should throw if type is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ type: value as DiscountType });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'type');
        });
      },
    );

    it('should throw if type is invalid', async() => {
      const data = makeValidData({ type: 'INVALID' as DiscountType });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'type');
      });
    });

    it.each([DiscountType.PERCENTAGE, DiscountType.MONETARY])(
      'should accept valid type (%s)',
      async(type: DiscountType) => {
        const data = makeValidData({ type });

        const result = await target.transform(data, metadata);

        expect(result.type).toBe(type);
      },
    );
  });

  describe('discountValue', () => {
    it.each([undefined, null, '', '   '])(
      'should throw if discountValue is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ discountValue: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'discountValue');
        });
      },
    );

    it('should throw if discountValue is negative', async() => {
      const data = makeValidData({ discountValue: -1 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'discountValue');
      });
    });

    it('should transform string discountValue to number', async() => {
      const data = { ...makeValidData(), discountValue: '5000' as unknown as number };

      const result = await target.transform(data, metadata);

      expect(result.discountValue).toBe(5000);
    });

    it('should accept discountValue 0', async() => {
      const data = makeValidData({ discountValue: 0 });

      const result = await target.transform(data, metadata);

      expect(result.discountValue).toBe(0);
    });

    it('should accept valid discountValue', async() => {
      const data = makeValidData({ discountValue: 10000 });

      const result = await target.transform(data, metadata);

      expect(result.discountValue).toBe(10000);
    });
  });

  describe('month', () => {
    it.each([undefined, null, '', '   '])(
      'should throw if month is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ month: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'month');
        });
      },
    );

    it.each([0, -1, 13, 100])('should throw if month is out of range (%s)', async(value: number) => {
      const data = makeValidData({ month: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'month');
      });
    });

    it.each([1, 6, 12])('should accept valid month (%s)', async(month: number) => {
      const data = makeValidData({ month });

      const result = await target.transform(data, metadata);

      expect(result.month).toBe(month);
    });
  });

  describe('year', () => {
    it.each([undefined, null, '', '   '])(
      'should throw if year is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ year: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'year');
        });
      },
    );

    it.each([2019, 2010, 0])('should throw if year is less than 2020 (%s)', async(value: number) => {
      const data = makeValidData({ year: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'year');
      });
    });

    it.each([2020, 2025, 2030])('should accept valid year (%s)', async(year: number) => {
      const data = makeValidData({ year });

      const result = await target.transform(data, metadata);

      expect(result.year).toBe(year);
    });
  });

  describe('doNotGenerateCharge', () => {
    it.each([undefined, null])(
      'should throw if doNotGenerateCharge is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ doNotGenerateCharge: value as boolean });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'doNotGenerateCharge');
        });
      },
    );

    it('should throw if doNotGenerateCharge is not boolean', async() => {
      const data = makeValidData({ doNotGenerateCharge: 'true' as unknown as boolean });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'doNotGenerateCharge');
      });
    });

    it('should accept doNotGenerateCharge true', async() => {
      const data = makeValidData({ doNotGenerateCharge: true });

      const result = await target.transform(data, metadata);

      expect(result.doNotGenerateCharge).toBe(true);
    });

    it('should accept doNotGenerateCharge false', async() => {
      const data = makeValidData({ doNotGenerateCharge: false });

      const result = await target.transform(data, metadata);

      expect(result.doNotGenerateCharge).toBe(false);
    });
  });

  describe('terminateContract', () => {
    it.each([undefined, null])(
      'should throw if terminateContract is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ terminateContract: value as boolean });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'terminateContract');
        });
      },
    );

    it('should throw if terminateContract is not boolean', async() => {
      const data = makeValidData({ terminateContract: 1 as unknown as boolean });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'terminateContract');
      });
    });

    it('should accept terminateContract true', async() => {
      const data = makeValidData({ terminateContract: true });

      const result = await target.transform(data, metadata);

      expect(result.terminateContract).toBe(true);
    });

    it('should accept terminateContract false', async() => {
      const data = makeValidData({ terminateContract: false });

      const result = await target.transform(data, metadata);

      expect(result.terminateContract).toBe(false);
    });
  });

  describe('all fields validation', () => {
    it('should pass if all fields are valid', async() => {
      const data = makeValidData();

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(CreateClientDiscountInputDto);
      expect(result.clientId).toBe(1);
      expect(result.description).toBe('Desconto de teste');
      expect(result.type).toBe(DiscountType.PERCENTAGE);
      expect(result.discountValue).toBe(1050);
      expect(result.month).toBe(3);
      expect(result.year).toBe(2026);
      expect(result.doNotGenerateCharge).toBe(false);
      expect(result.terminateContract).toBe(false);
    });

    it('should pass with MONETARY type and all flags true', async() => {
      const data = makeValidData({
        type: DiscountType.MONETARY,
        discountValue: 5000,
        doNotGenerateCharge: true,
        terminateContract: true,
      });

      const result = await target.transform(data, metadata);

      expect(result.type).toBe(DiscountType.MONETARY);
      expect(result.discountValue).toBe(5000);
      expect(result.doNotGenerateCharge).toBe(true);
      expect(result.terminateContract).toBe(true);
    });
  });
});

describe('CreateClientDiscountOutputDto', () => {
  it('should have id property', () => {
    const output: CreateClientDiscountOutputDto = { id: 1 };

    expect(output.id).toBe(1);
  });
});
