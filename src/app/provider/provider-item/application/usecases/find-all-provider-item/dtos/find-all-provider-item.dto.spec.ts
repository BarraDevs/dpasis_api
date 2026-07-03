import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllProviderItemQueryDto } from './find-all-provider-item.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllProviderItemQueryDto,
};

describe('FindAllProviderItemQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('providerId', () => {
    it.each([undefined, null, '', '   '])(
      'should throw an error if providerId is empty (%s)',
      async(value: unknown) => {
        const data = { providerId: value };

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('providerId é obrigatório');
        });
      },
    );

    it('should transform string providerId to number', async() => {
      const data = { providerId: '42' };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(FindAllProviderItemQueryDto);
      expect(result.providerId).toBe(42);
    });

    it('should accept numeric providerId', async() => {
      const data = { providerId: 1 };

      const result = await target.transform(data, metadata);

      expect(result.providerId).toBe(1);
    });

    it('should throw an error if providerId is not numeric', async() => {
      const data = { providerId: 'abc' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message;
        const text = Array.isArray(message) ? message.join(' ') : message;
        expect(text).toContain('providerId');
      });
    });
  });

  describe('inherited from Queries', () => {
    it('should accept optional page and size', async() => {
      const data = { providerId: 1, page: '1', size: '10' };

      const result = await target.transform(data, metadata);

      expect(result.providerId).toBe(1);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
    });

    it('should accept optional search', async() => {
      const data = { providerId: 1, search: '  Manutenção  ' };

      const result = await target.transform(data, metadata);

      expect(result.providerId).toBe(1);
      expect(result.search).toBe('Manutenção');
    });
  });

  it('should pass if all required fields are valid', async() => {
    const data = { providerId: 1 };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(FindAllProviderItemQueryDto);
    expect(result.providerId).toBe(1);
  });
});
