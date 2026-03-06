import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllClientDiscountQueryDto } from './find-all-client-discount.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllClientDiscountQueryDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

describe('FindAllClientDiscountQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('clientId', () => {
    it.each([undefined, null, '', '   '])(
      'should throw if clientId is empty (%s)',
      async(value: unknown) => {
        const data = { clientId: value };

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'clientId');
        });
      },
    );

    it.each([0, -1])('should throw if clientId is less than 1 (%s)', async(value: number) => {
      const data = { clientId: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'clientId');
      });
    });

    it('should transform string clientId to number', async() => {
      const data = { clientId: '42' };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(FindAllClientDiscountQueryDto);
      expect(result.clientId).toBe(42);
    });

    it('should accept numeric clientId', async() => {
      const data = { clientId: 1 };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(1);
    });
  });

  describe('month (optional)', () => {
    it('should accept valid month when provided', async() => {
      const data = { clientId: 1, month: 6 };

      const result = await target.transform(data, metadata);

      expect(result.month).toBe(6);
    });

    it('should accept when month is omitted', async() => {
      const data = { clientId: 1 };

      const result = await target.transform(data, metadata);

      expect(result.month).toBeUndefined();
    });

    it.each([0, -1, 13, 100])('should throw if month is out of range (%s)', async(value: number) => {
      const data = { clientId: 1, month: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'month');
      });
    });

    it.each([1, 12])('should accept boundary month (%s)', async(month: number) => {
      const data = { clientId: 1, month };

      const result = await target.transform(data, metadata);

      expect(result.month).toBe(month);
    });

    it('should transform string month to number', async() => {
      const data = { clientId: 1, month: '3' };

      const result = await target.transform(data, metadata);

      expect(result.month).toBe(3);
    });
  });

  describe('year (optional)', () => {
    it('should accept valid year when provided', async() => {
      const data = { clientId: 1, year: 2026 };

      const result = await target.transform(data, metadata);

      expect(result.year).toBe(2026);
    });

    it('should accept when year is omitted', async() => {
      const data = { clientId: 1 };

      const result = await target.transform(data, metadata);

      expect(result.year).toBeUndefined();
    });

    it.each([2019, 2010, 0])('should throw if year is less than 2020 (%s)', async(value: number) => {
      const data = { clientId: 1, year: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'year');
      });
    });

    it('should accept boundary year 2020', async() => {
      const data = { clientId: 1, year: 2020 };

      const result = await target.transform(data, metadata);

      expect(result.year).toBe(2020);
    });

    it('should transform string year to number', async() => {
      const data = { clientId: 1, year: '2025' };

      const result = await target.transform(data, metadata);

      expect(result.year).toBe(2025);
    });
  });

  describe('inherited from Queries', () => {
    it('should accept optional page and size', async() => {
      const data = { clientId: 1, page: '1', size: '10' };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(1);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
    });

    it('should accept optional search', async() => {
      const data = { clientId: 1, search: '  Desconto  ' };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(1);
      expect(result.search).toBe('Desconto');
    });
  });

  describe('combined validations', () => {
    it('should pass with clientId only', async() => {
      const data = { clientId: 1 };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(FindAllClientDiscountQueryDto);
      expect(result.clientId).toBe(1);
      expect(result.month).toBeUndefined();
      expect(result.year).toBeUndefined();
    });

    it('should pass with all optional fields', async() => {
      const data = {
        clientId: 42,
        month: 6,
        year: 2026,
        page: '2',
        size: '20',
        search: 'especial',
      };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(42);
      expect(result.month).toBe(6);
      expect(result.year).toBe(2026);
      expect(result.page).toBe(2);
      expect(result.size).toBe(20);
      expect(result.search).toBe('especial');
    });
  });
});
