import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { BooleanFilterDto } from './boolean-filter.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: BooleanFilterDto,
};

function makeBooleanFilterDto(overrides: Partial<BooleanFilterDto> = {}): Record<string, unknown> {
  return { ...overrides };
}

describe('BooleanFilterDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });

  it('should accept empty body', async() => {
    const result = await target.transform(makeBooleanFilterDto(), metadata);
    expect(result).toBeInstanceOf(BooleanFilterDto);
  });

  describe('StringToBoolean coercion', () => {
    it('should coerce eq from string true/false (case insensitive)', async() => {
      const lower = await target.transform(makeBooleanFilterDto({ eq: 'true' as any }), metadata);
      const upper = await target.transform(makeBooleanFilterDto({ eq: 'FALSE' as any }), metadata);
      expect(lower.eq).toBe(true);
      expect(upper.eq).toBe(false);
    });

    it('should accept boolean eq', async() => {
      const result = await target.transform(makeBooleanFilterDto({ eq: true }), metadata);
      expect(result.eq).toBe(true);
    });

    it('should reject eq when string is not true/false', async() => {
      const data = makeBooleanFilterDto({ eq: 'maybe' as any });
      expect.assertions(1);
      return target.transform(data, metadata).catch((error: { getResponse(): { message: unknown } }) => {
        expect(error.getResponse().message).toContain('eq deve ser um booleano');
      });
    });
  });

  describe('isNull', () => {
    it('should accept isNull as boolean', async() => {
      const result = await target.transform(makeBooleanFilterDto({ isNull: false }), metadata);
      expect(result.isNull).toBe(false);
    });

    it('should coerce isNull from string', async() => {
      const result = await target.transform(makeBooleanFilterDto({ isNull: 'true' as any }), metadata);
      expect(result.isNull).toBe(true);
    });
  });
});
