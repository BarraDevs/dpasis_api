import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllClientTypeQueryDto } from './find-all-client-type.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllClientTypeQueryDto,
};

function makeValidQueryDto(
  overrides: Partial<FindAllClientTypeQueryDto> = {},
): FindAllClientTypeQueryDto {
  return {
    clientId: 1,
    ...overrides,
  };
}

describe('FindAllClientTypeQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('clientId field', () => {
    it.each([undefined, null, '', '  '])(
      'should throw an error if clientId is empty (%s)',
      async(value: unknown) => {
        const data = makeValidQueryDto({ clientId: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('clientId é obrigatório');
        });
      },
    );

    it.each([1.5, 'abc', true, false, {}, []])(
      'should throw an error if clientId is not an integer (%s)',
      async(value: unknown) => {
        const data = makeValidQueryDto({ clientId: value as number });

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
      const data = { ...makeValidQueryDto(), clientId: '99' as unknown };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(99);
    });
  });

  describe('search field', () => {
    it('should accept search string for filtering by system/description/drive name', async() => {
      const data = makeValidQueryDto({ clientId: 1, search: 'sistema' });

      const result = await target.transform(data, metadata);

      expect(result.search).toBe('sistema');
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

      expect(result).toBeInstanceOf(FindAllClientTypeQueryDto);
      expect(result.clientId).toBe(1);
    });

    it('should pass with clientId, page, size and search', async() => {
      const data = makeValidQueryDto({
        clientId: 5,
        page: 1,
        size: 10,
        search: 'google drive',
      });

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(5);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
      expect(result.search).toBe('google drive');
    });
  });
});
