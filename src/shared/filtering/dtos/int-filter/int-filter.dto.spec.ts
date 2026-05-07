import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { IntFilterDto } from './int-filter.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: IntFilterDto,
};

function makeIntFilterDto(overrides: Partial<IntFilterDto> = {}): Record<string, unknown> {
  return { ...overrides };
}

describe('IntFilterDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });

  it('should accept empty body', async() => {
    const result = await target.transform(makeIntFilterDto(), metadata);
    expect(result).toBeInstanceOf(IntFilterDto);
  });

  describe('StringToNumber coercion', () => {
    it('should coerce eq from numeric string', async() => {
      const result = await target.transform(makeIntFilterDto({ eq: '42' as any }), metadata);
      expect(result.eq).toBe(42);
    });

    it('should coerce ne and comparison fields from numeric string', async() => {
      const result = await target.transform(
        makeIntFilterDto({
          ne: '1' as any,
          gt: '0' as any,
          gte: '0' as any,
          lt: '10' as any,
          lte: '10' as any,
        }),
        metadata,
      );
      expect(result.ne).toBe(1);
      expect(result.gt).toBe(0);
      expect(result.gte).toBe(0);
      expect(result.lt).toBe(10);
      expect(result.lte).toBe(10);
    });

    it('should reject non-integer after coercion (decimal string)', async() => {
      const data = makeIntFilterDto({ eq: '3.14' as any });
      expect.assertions(1);
      return target.transform(data, metadata).catch((error: { getResponse(): { message: unknown } }) => {
        expect(error.getResponse().message).toContain('eq deve ser um número inteiro');
      });
    });
  });

  describe('in / notIn', () => {
    it('should accept in with integers', async() => {
      const result = await target.transform(makeIntFilterDto({ in: [1, 2, 3] }), metadata);
      expect(result.in).toEqual([1, 2, 3]);
    });

    it('should reject in item that is not an integer', async() => {
      const data = makeIntFilterDto({ in: ['a'] as unknown as number[] });
      expect.assertions(1);
      return target.transform(data, metadata).catch((error: { getResponse(): { message: unknown } }) => {
        expect(error.getResponse().message).toContain('cada item de in deve ser um número inteiro');
      });
    });

    it('should reject in when not array', async() => {
      const data = makeIntFilterDto({ in: 'not-array' as any });
      expect.assertions(1);
      return target.transform(data, metadata).catch((error: { getResponse(): { message: unknown } }) => {
        expect(error.getResponse().message).toContain('in deve ser um array');
      });
    });
  });

  describe('isNull', () => {
    it('should coerce isNull from string true/false', async() => {
      const truthy = await target.transform(makeIntFilterDto({ isNull: 'true' as any }), metadata);
      const falsy = await target.transform(makeIntFilterDto({ isNull: 'FALSE' as any }), metadata);
      expect(truthy.isNull).toBe(true);
      expect(falsy.isNull).toBe(false);
    });

    it('should reject invalid isNull string after coercion attempt', async() => {
      const data = makeIntFilterDto({ isNull: 'maybe' as any });
      expect.assertions(1);
      return target.transform(data, metadata).catch((error: { getResponse(): { message: unknown } }) => {
        expect(error.getResponse().message).toContain('isNull deve ser um booleano');
      });
    });
  });
});
