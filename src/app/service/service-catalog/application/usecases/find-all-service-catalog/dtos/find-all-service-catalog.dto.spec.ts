import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllServiceCatalogQueryDto } from './find-all-service-catalog.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllServiceCatalogQueryDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

function makeValidQuery(
  overrides: Partial<FindAllServiceCatalogQueryDto> = {},
): FindAllServiceCatalogQueryDto {
  return {
    page: 1,
    size: 10,
    ...overrides,
  };
}

describe('FindAllServiceCatalogQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('cnaeNbsIndopId', () => {
    it('should be optional', async() => {
      const data = makeValidQuery({ cnaeNbsIndopId: undefined });

      const result = await target.transform(data, metadata);

      expect(result.cnaeNbsIndopId).toBeUndefined();
    });

    it('should throw if cnaeNbsIndopId is not an integer', async() => {
      const data = makeValidQuery({ cnaeNbsIndopId: 1.5 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'cnaeNbsIndopId deve ser um número inteiro');
      });
    });

    it('should throw if cnaeNbsIndopId is zero', async() => {
      const data = makeValidQuery({ cnaeNbsIndopId: 0 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'cnaeNbsIndopId deve ser um número positivo');
      });
    });

    it('should throw if cnaeNbsIndopId is negative', async() => {
      const data = makeValidQuery({ cnaeNbsIndopId: -1 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'cnaeNbsIndopId deve ser um número positivo');
      });
    });

    it('should accept positive cnaeNbsIndopId', async() => {
      const data = makeValidQuery({ cnaeNbsIndopId: 42 });

      const result = await target.transform(data, metadata);

      expect(result.cnaeNbsIndopId).toBe(42);
    });

    it('should transform string cnaeNbsIndopId to number', async() => {
      const data = { ...makeValidQuery(), cnaeNbsIndopId: '7' as unknown as number };

      const result = await target.transform(data, metadata);

      expect(result.cnaeNbsIndopId).toBe(7);
    });
  });

  describe('inherited Queries fields', () => {
    it('should accept page and size', async() => {
      const data = makeValidQuery({ page: 2, size: 20 });

      const result = await target.transform(data, metadata);

      expect(result.page).toBe(2);
      expect(result.size).toBe(20);
    });

    it('should accept search and active', async() => {
      const data = makeValidQuery({ search: 'manutenção', active: true });

      const result = await target.transform(data, metadata);

      expect(result.search).toBe('manutenção');
      expect(result.active).toBe(true);
    });
  });

  describe('full query', () => {
    it('should pass with all optional filters', async() => {
      const data = makeValidQuery({
        page: 1,
        size: 15,
        search: 'teste',
        active: false,
        cnaeNbsIndopId: 99,
      });

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(FindAllServiceCatalogQueryDto);
      expect(result.cnaeNbsIndopId).toBe(99);
      expect(result.search).toBe('teste');
      expect(result.active).toBe(false);
    });

    it('should strip properties not in the DTO (whitelist)', async() => {
      const data = { ...makeValidQuery(), extraField: 'ignored' } as FindAllServiceCatalogQueryDto & {
        extraField: string;
      };

      const result = await target.transform(data, metadata);

      expect((result as unknown as { extraField?: string }).extraField).toBeUndefined();
    });
  });
});
