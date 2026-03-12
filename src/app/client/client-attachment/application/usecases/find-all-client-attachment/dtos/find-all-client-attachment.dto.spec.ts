import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllClientAttachmentQueryDto } from './find-all-client-attachment.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllClientAttachmentQueryDto,
};

function makeValidQueryDto(
  overrides: Partial<FindAllClientAttachmentQueryDto> = {},
): FindAllClientAttachmentQueryDto {
  return {
    clientId: 1,
    ...overrides,
  };
}

describe('FindAllClientAttachmentQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('clientId field', () => {
    it.each([undefined, null, '', '  '])(
      'should throw an error if clientId is empty (%s)',
      async(value: any) => {
        const data = makeValidQueryDto({ clientId: value as any });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(
            'clientId é obrigatório',
          );
        });
      },
    );

    it.each([1.5, 'abc', true, false, {}, []])(
      'should throw an error if clientId is not an integer (%s)',
      async(value: any) => {
        const data = makeValidQueryDto({ clientId: value as any });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(
            'clientId deve ser um número inteiro',
          );
        });
      },
    );

    it('should accept valid clientId', async() => {
      const data = makeValidQueryDto({ clientId: 42 });

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(42);
    });

    it('should transform string number to number', async() => {
      const data = { ...makeValidQueryDto(), clientId: '99' as any };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(99);
    });

    it('should trim whitespace from clientId', async() => {
      const data = { ...makeValidQueryDto(), clientId: '  1  ' as any };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(1);
    });
  });

  describe('pagination fields (from Queries)', () => {
    it('should accept page and size', async() => {
      const data = makeValidQueryDto({ clientId: 1, page: 2, size: 20 });

      const result = await target.transform(data, metadata);

      expect(result.page).toBe(2);
      expect(result.size).toBe(20);
    });

    it('should transform string page to number', async() => {
      const data = { ...makeValidQueryDto(), page: '3' as any };

      const result = await target.transform(data, metadata);

      expect(result.page).toBe(3);
    });

    it('should transform string size to number', async() => {
      const data = { ...makeValidQueryDto(), size: '15' as any };

      const result = await target.transform(data, metadata);

      expect(result.size).toBe(15);
    });
  });

  describe('search field', () => {
    it('should accept search string', async() => {
      const data = makeValidQueryDto({ clientId: 1, search: 'contrato' });

      const result = await target.transform(data, metadata);

      expect(result.search).toBe('contrato');
    });

    it('should trim search', async() => {
      const data = makeValidQueryDto({ clientId: 1, search: '  busca  ' });

      const result = await target.transform(data, metadata);

      expect(result.search).toBe('busca');
    });

    it('should be optional', async() => {
      const data = makeValidQueryDto({ clientId: 1 });

      const result = await target.transform(data, metadata);

      expect(result.search).toBeUndefined();
    });
  });

  describe('all fields validation', () => {
    it('should pass with only clientId', async() => {
      const data = makeValidQueryDto({ clientId: 1 });

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(FindAllClientAttachmentQueryDto);
      expect(result.clientId).toBe(1);
    });

    it('should pass with clientId, page, size and search', async() => {
      const data = makeValidQueryDto({
        clientId: 5,
        page: 1,
        size: 10,
        search: 'nota fiscal',
      });

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(5);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
      expect(result.search).toBe('nota fiscal');
    });
  });
});
