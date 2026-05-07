import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllResaleContactQueryDto } from './find-all-resale-contact.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllResaleContactQueryDto,
};

function makeValidQueryDto(
  overrides: Partial<FindAllResaleContactQueryDto> = {},
): FindAllResaleContactQueryDto {
  return {
    resaleId: '1',
    ...overrides,
  };
}

describe('FindAllResaleContactQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('resaleId field', () => {
    it.each([undefined, null, '', '  '])(
      'should throw when resaleId is empty (%s)',
      async(value: unknown) => {
        const data = makeValidQueryDto({ resaleId: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('resaleId é obrigatório');
        });
      },
    );

    it('should accept valid hexadecimal resaleId', async() => {
      const data = makeValidQueryDto({ resaleId: '43' });

      const result = await target.transform(data, metadata);

      expect(result.resaleId).toBe('43');
    });

    it('should trim resaleId', async() => {
      const data = makeValidQueryDto({ resaleId: '  AB  ' });

      const result = await target.transform(data, metadata);

      expect(result.resaleId).toBe('AB');
    });

    it('should reject invalid hex', async() => {
      const data = makeValidQueryDto({ resaleId: 'GG' });

      await expect(target.transform(data, metadata)).rejects.toBeDefined();
    });

    it('should reject resaleId longer than 8 hex digits', async() => {
      const data = makeValidQueryDto({ resaleId: '123456789' });

      await expect(target.transform(data, metadata)).rejects.toBeDefined();
    });
  });

  describe('departmentId field', () => {
    it('should coerce string departmentId to number', async() => {
      const data = { ...makeValidQueryDto(), departmentId: '5' as unknown as number };

      const result = await target.transform(data, metadata);

      expect(result.departmentId).toBe(5);
    });
  });

  describe('receiveNF field', () => {
    it('should coerce string receiveNF to boolean', async() => {
      const data = { ...makeValidQueryDto(), receiveNF: 'true' as unknown as boolean };

      const result = await target.transform(data, metadata);

      expect(result.receiveNF).toBe(true);
    });
  });

  describe('pagination from Queries', () => {
    it('should accept page and size', async() => {
      const data = {
        ...makeValidQueryDto(),
        page: '2',
        size: '20',
      };

      const result = await target.transform(data, metadata);

      expect(result.page).toBe(2);
      expect(result.size).toBe(20);
    });
  });
});
