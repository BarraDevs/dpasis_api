import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllClientInvoiceConfigQueryDto } from './find-all-client-invoice-config.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllClientInvoiceConfigQueryDto,
};

function makeValidQueryDto(
  overrides: Partial<FindAllClientInvoiceConfigQueryDto> = {},
): FindAllClientInvoiceConfigQueryDto {
  return {
    ...overrides,
  } as FindAllClientInvoiceConfigQueryDto;
}

describe('FindAllClientInvoiceConfigQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('dueDateDay field', () => {
    it('should be optional', async() => {
      const data = makeValidQueryDto({});

      const result = await target.transform(data, metadata);

      expect(result.dueDateDay).toBeUndefined();
    });

    it('should accept valid dueDateDay', async() => {
      const data = makeValidQueryDto({ dueDateDay: 15 });

      const result = await target.transform(data, metadata);

      expect(result.dueDateDay).toBe(15);
    });

    it('should transform string dueDateDay to number', async() => {
      const data = { ...makeValidQueryDto(), dueDateDay: '20' as any };

      const result = await target.transform(data, metadata);

      expect(result.dueDateDay).toBe(20);
    });

    it('should throw if dueDateDay is below 1', async() => {
      const data = makeValidQueryDto({ dueDateDay: 0 });

      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('dueDateDay deve ser entre 1 e 31');
      });
    });

    it('should throw if dueDateDay is above 31', async() => {
      const data = makeValidQueryDto({ dueDateDay: 32 });

      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('dueDateDay deve ser entre 1 e 31');
      });
    });

    it.each([1.5, 'abc', true])(
      'should throw if dueDateDay is not an integer (%s)',
      async(value: any) => {
        const data = { ...makeValidQueryDto(), dueDateDay: value };

        expect.assertions(1);
        await target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('dueDateDay deve ser um número inteiro');
        });
      },
    );
  });

  describe('generateNf field', () => {
    it('should be optional', async() => {
      const data = makeValidQueryDto({});

      const result = await target.transform(data, metadata);

      expect(result.generateNf).toBeUndefined();
    });

    it('should accept true and false', async() => {
      const trueResult = await target.transform(makeValidQueryDto({ generateNf: true }), metadata);
      const falseResult = await target.transform(makeValidQueryDto({ generateNf: false }), metadata);

      expect(trueResult.generateNf).toBe(true);
      expect(falseResult.generateNf).toBe(false);
    });

    it.each([
      ['true', true],
      ['false', false],
    ])('should transform string %s to boolean', async(str, expected) => {
      const data = { ...makeValidQueryDto(), generateNf: str as any };

      const result = await target.transform(data, metadata);

      expect(result.generateNf).toBe(expected);
    });

    it('should throw if generateNf is not a boolean', async() => {
      const data = { ...makeValidQueryDto(), generateNf: 'maybe' as any };

      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('generateNf deve ser um booleano');
      });
    });
  });

  describe('pagination fields (from Queries)', () => {
    it('should accept page and size', async() => {
      const data = makeValidQueryDto({ page: 2, size: 20 });

      const result = await target.transform(data, metadata);

      expect(result.page).toBe(2);
      expect(result.size).toBe(20);
    });
  });

  describe('search field (from Queries)', () => {
    it('should trim search', async() => {
      const data = makeValidQueryDto({ search: '  texto  ' });

      const result = await target.transform(data, metadata);

      expect(result.search).toBe('texto');
    });
  });
});
