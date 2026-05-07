import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { DateFilterDto } from './date-filter.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: DateFilterDto,
};

function makeDateFilterDto(overrides: Partial<DateFilterDto> = {}): Record<string, unknown> {
  return { ...overrides };
}

describe('DateFilterDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });

  it('should accept empty body', async() => {
    const result = await target.transform(makeDateFilterDto(), metadata);
    expect(result).toBeInstanceOf(DateFilterDto);
  });

  describe('ISO 8601', () => {
    it.each(['eq', 'ne', 'gt', 'gte', 'lt', 'lte'] as const)(
      'should accept valid ISO 8601 on %s',
      async(field) => {
        const iso = '2026-01-01T00:00:00.000Z';
        const data = makeDateFilterDto({ [field]: iso });
        const result = await target.transform(data, metadata);
        expect(result[field]).toBe(iso);
      },
    );

    it('should trim whitespace before validating ISO 8601 on gte', async() => {
      const iso = '2026-01-01T00:00:00.000Z';
      const data = makeDateFilterDto({ gte: `  ${iso}  ` });
      const result = await target.transform(data, metadata);
      expect(result.gte).toBe(iso);
    });

    it('should reject invalid iso with pt-BR message', async() => {
      const data = makeDateFilterDto({ gte: 'not-a-date' });
      expect.assertions(1);
      return target.transform(data, metadata).catch((error: { getResponse(): { message: unknown } }) => {
        expect(error.getResponse().message).toContain('gte deve estar no formato ISO 8601');
      });
    });
  });

  describe('isNull', () => {
    it('should accept isNull boolean', async() => {
      const result = await target.transform(makeDateFilterDto({ isNull: true }), metadata);
      expect(result.isNull).toBe(true);
    });

    it('should coerce isNull from string', async() => {
      const result = await target.transform(makeDateFilterDto({ isNull: 'false' as any }), metadata);
      expect(result.isNull).toBe(false);
    });
  });
});
