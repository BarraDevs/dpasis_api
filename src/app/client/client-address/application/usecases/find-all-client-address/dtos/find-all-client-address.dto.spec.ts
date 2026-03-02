import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllClientAddressQueryDto } from './find-all-client-address.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllClientAddressQueryDto,
};

describe('FindAllClientAddressQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('clientId', () => {
    it.each([undefined, null, '', '   '])(
      'should throw an error if clientId is empty (%s)',
      async(value: unknown) => {
        const data = { clientId: value };

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('clientId é obrigatório');
        });
      },
    );

    it('should transform string clientId to number', async() => {
      const data = { clientId: '42' };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(FindAllClientAddressQueryDto);
      expect(result.clientId).toBe(42);
    });

    it('should accept numeric clientId', async() => {
      const data = { clientId: 1 };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(1);
    });
  });

  describe('type (optional)', () => {
    it('should accept valid type enum value', async() => {
      const data = { clientId: 1, type: ClientAddressType.MAIN };

      const result = await target.transform(data, metadata);

      expect(result.type).toBe(ClientAddressType.MAIN);
    });

    it('should accept when type is omitted', async() => {
      const data = { clientId: 1 };

      const result = await target.transform(data, metadata);

      expect(result.type).toBeUndefined();
    });

    it('should throw an error if type is invalid', async() => {
      const data = { clientId: 1, type: 'INVALID' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('type deve ser um tipo de endereço válido');
      });
    });
  });

  describe('inherited from Queries', () => {
    it('should accept optional page and size', async() => {
      const data = { clientId: 1, page: '1', size: '10' };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(1);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
    });

    it('should accept optional search', async() => {
      const data = { clientId: 1, search: '  Rua Teste  ' };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(1);
      expect(result.search).toBe('Rua Teste');
    });
  });

  it('should pass if all required fields are valid', async() => {
    const data = { clientId: 1 };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(FindAllClientAddressQueryDto);
    expect(result.clientId).toBe(1);
  });
});
