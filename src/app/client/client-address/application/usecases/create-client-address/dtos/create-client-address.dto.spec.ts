import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateClientAddressInputDto } from './create-client-address.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateClientAddressInputDto,
};

function makeValidData(overrides?: Partial<CreateClientAddressInputDto>) {
  return {
    clientId: 1,
    type: ClientAddressType.MAIN,
    zipCode: '12345-678',
    street: 'Rua Teste',
    number: '123',
    complement: null,
    neighborhood: 'Centro',
    city: 'São Paulo',
    cityCodeIbge: '3550308',
    state: 'SP',
    ...overrides,
  };
}

describe('CreateClientAddressInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('clientId', () => {
    it.each([undefined, null, '', '   '])(
      'should throw an error if clientId is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ clientId: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('clientId é obrigatório');
        });
      },
    );

    it('should transform string clientId to number', async() => {
      const data = { ...makeValidData(), clientId: '42' };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(42);
    });
  });

  describe('type', () => {
    it.each([undefined, null, '', '   '])(
      'should throw an error if type is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ type: value as ClientAddressType });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('type inválido.');
        });
      },
    );

    it('should throw an error if type is invalid', async() => {
      const data = makeValidData({ type: 'INVALID' as ClientAddressType });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('type inválido.');
      });
    });

    it.each([
      ClientAddressType.MAIN,
      ClientAddressType.BILLING,
      ClientAddressType.SUPPORT,
      ClientAddressType.CORRESPONDENCE,
    ])('should accept valid type (%s)', async(type: ClientAddressType) => {
      const data = makeValidData({ type });

      const result = await target.transform(data, metadata);

      expect(result.type).toBe(type);
    });
  });

  describe('zipCode', () => {
    it.each([undefined, null, '', '   '])(
      'should throw an error if zipCode is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ zipCode: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('zipCode é obrigatório');
        });
      },
    );
  });

  describe('street', () => {
    it.each([undefined, null, '', '   '])(
      'should throw an error if street is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ street: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('street é obrigatório');
        });
      },
    );

    it('should trim street', async() => {
      const data = makeValidData({ street: '  Rua Teste  ' });

      const result = await target.transform(data, metadata);

      expect(result.street).toBe('Rua Teste');
    });
  });

  describe('number', () => {
    it.each([undefined, null, '', '   '])(
      'should throw an error if number is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ number: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('number é obrigatório');
        });
      },
    );
  });

  describe('complement (optional)', () => {
    it('should accept null complement', async() => {
      const data = makeValidData({ complement: null });

      const result = await target.transform(data, metadata);

      expect(result.complement).toBeNull();
    });

    it('should accept string complement', async() => {
      const data = makeValidData({ complement: 'Apto 101' });

      const result = await target.transform(data, metadata);

      expect(result.complement).toBe('Apto 101');
    });

    it('should trim complement', async() => {
      const data = makeValidData({ complement: '  Sala 5  ' });

      const result = await target.transform(data, metadata);

      expect(result.complement).toBe('Sala 5');
    });
  });

  describe('neighborhood', () => {
    it.each([undefined, null, '', '   '])(
      'should throw an error if neighborhood is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ neighborhood: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('neighborhood é obrigatório');
        });
      },
    );
  });

  describe('city', () => {
    it.each([undefined, null, '', '   '])(
      'should throw an error if city is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ city: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('city é obrigatório');
        });
      },
    );
  });

  describe('cityCodeIbge (optional)', () => {
    it('should accept null cityCodeIbge', async() => {
      const data = makeValidData({ cityCodeIbge: null });

      const result = await target.transform(data, metadata);

      expect(result.cityCodeIbge).toBeNull();
    });

    it('should accept undefined cityCodeIbge', async() => {
      const data = { ...makeValidData() };
      delete (data as { cityCodeIbge?: string | null }).cityCodeIbge;

      const result = await target.transform(data, metadata);

      expect(result.cityCodeIbge).toBeUndefined();
    });

    it('should accept string cityCodeIbge', async() => {
      const data = makeValidData({ cityCodeIbge: '3550308' });

      const result = await target.transform(data, metadata);

      expect(result.cityCodeIbge).toBe('3550308');
    });

    it('should trim cityCodeIbge', async() => {
      const data = makeValidData({ cityCodeIbge: '  3550308  ' });

      const result = await target.transform(data, metadata);

      expect(result.cityCodeIbge).toBe('3550308');
    });

    it('should throw an error if cityCodeIbge exceeds max length', async() => {
      const data = makeValidData({ cityCodeIbge: '12345678' });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('cityCodeIbge deve ter no máximo 7 caracteres');
      });
    });
  });

  describe('state', () => {
    it.each([undefined, null, '', '   '])(
      'should throw an error if state is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ state: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('state é obrigatório');
        });
      },
    );
  });

  it('should pass if all required fields are valid', async() => {
    const data = makeValidData();

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(CreateClientAddressInputDto);
    expect(result.clientId).toBe(1);
    expect(result.type).toBe(ClientAddressType.MAIN);
    expect(result.zipCode).toBe('12345-678');
    expect(result.street).toBe('Rua Teste');
    expect(result.number).toBe('123');
    expect(result.neighborhood).toBe('Centro');
    expect(result.city).toBe('São Paulo');
    expect(result.state).toBe('SP');
  });
});
