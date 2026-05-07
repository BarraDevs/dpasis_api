import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { pipeOptions } from 'src/infra/validators/class/config';
import { StringFilterDto } from './string-filter.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: StringFilterDto,
};

function makeStringFilterDto(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...overrides };
}

describe('StringFilterDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });

  it('should accept empty body (all filters optional)', async() => {
    // Arrange
    const data = makeStringFilterDto();

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(StringFilterDto);
  });

  describe('eq', () => {
    it('should trim whitespace from eq', async() => {
      // Arrange
      const data = makeStringFilterDto({ eq: '  a  ' });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.eq).toBe('a');
    });

    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should reject non-string eq (%s)', async(value: unknown) => {
      expect.assertions(1);
      return target.transform(makeStringFilterDto({ eq: value }), metadata).catch((error: { getResponse(): { message: unknown } }) => {
        expect(error.getResponse().message).toContain('eq deve ser um texto');
      });
    });
  });

  describe('ne', () => {
    it('should trim whitespace from ne', async() => {
      // Arrange
      const data = makeStringFilterDto({ ne: '  b  ' });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.ne).toBe('b');
    });
  });

  describe('contains', () => {
    it('should trim whitespace from contains', async() => {
      // Arrange
      const data = makeStringFilterDto({ contains: '  João  ' });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.contains).toBe('João');
    });
  });

  describe('startsWith / endsWith', () => {
    it('should trim startsWith and endsWith', async() => {
      // Arrange
      const data = makeStringFilterDto({ startsWith: '  pre  ', endsWith: '  suf  ' });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.startsWith).toBe('pre');
      expect(result.endsWith).toBe('suf');
    });
  });

  describe('in', () => {
    it('should accept string array items (no Trim on array elements)', async() => {
      // Arrange
      const data = makeStringFilterDto({ in: [' x ', 'y'] });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.in).toEqual([' x ', 'y']);
    });

    it.each([
      ['não-array' as unknown, 'in deve ser um array'],
      [[1, 2], 'cada item de in deve ser um texto'],
    ])('should reject invalid in (%s)', async(payload: unknown, expectedFragment: string) => {
      const data = makeStringFilterDto({ in: payload as string[] });
      expect.assertions(1);
      return target.transform(data, metadata).catch((error: { getResponse(): { message: unknown } }) => {
        expect(error.getResponse().message).toContain(expectedFragment);
      });
    });
  });

  describe('notIn', () => {
    it('should accept notIn string array', async() => {
      // Arrange
      const data = makeStringFilterDto({ notIn: ['a', 'b'] });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.notIn).toEqual(['a', 'b']);
    });

    it('should reject notIn items that are not strings', async() => {
      const data = makeStringFilterDto({ notIn: [1, 2] as unknown as string[] });
      expect.assertions(1);
      return target.transform(data, metadata).catch((error: { getResponse(): { message: unknown } }) => {
        expect(error.getResponse().message).toContain('cada item de notIn deve ser um texto');
      });
    });
  });

  describe('isNull', () => {
    it('should accept isNull true/false', async() => {
      const whenTrue = await target.transform(makeStringFilterDto({ isNull: true }), metadata);
      const whenFalse = await target.transform(makeStringFilterDto({ isNull: false }), metadata);

      expect(whenTrue.isNull).toBe(true);
      expect(whenFalse.isNull).toBe(false);
    });

    it('should reject isNull string', async() => {
      const data = makeStringFilterDto({ isNull: 'true' });
      expect.assertions(1);
      return target.transform(data, metadata).catch((error: { getResponse(): { message: unknown } }) => {
        expect(error.getResponse().message).toContain('isNull deve ser um booleano');
      });
    });
  });

  describe('plain validate (no whitelist)', () => {
    it('still accepts trimmed eq via class-validator validate after plainToInstance', async() => {
      const dto = plainToInstance(StringFilterDto, { eq: '  a  ' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.eq).toBe('a');
    });
  });
});
