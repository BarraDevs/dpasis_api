import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ClientAddressType } from 'src/app/client-address/domain/enums/client-address-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditClientAddressInputDto } from './edit-client-address.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditClientAddressInputDto,
};

describe('EditClientAddressInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should pass with empty object (all fields optional)', async() => {
    const data = {};

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditClientAddressInputDto);
    expect(result).toEqual({});
  });

  describe('type', () => {
    it('should throw an error if type is invalid', async() => {
      const data = { type: 'INVALID' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('type deve ser um tipo de endereço válido');
      });
    });

    it.each([
      ClientAddressType.MAIN,
      ClientAddressType.BILLING,
      ClientAddressType.SUPPORT,
      ClientAddressType.CORRESPONDENCE,
    ])('should accept valid type (%s)', async(type: ClientAddressType) => {
      const data = { type };

      const result = await target.transform(data, metadata);

      expect(result.type).toBe(type);
    });
  });

  describe('zipCode', () => {
    it('should accept valid zipCode', async() => {
      const data = { zipCode: '12345-678' };

      const result = await target.transform(data, metadata);

      expect(result.zipCode).toBe('12345-678');
    });

    it('should trim zipCode', async() => {
      const data = { zipCode: '  12345-678  ' };

      const result = await target.transform(data, metadata);

      expect(result.zipCode).toBe('12345-678');
    });
  });

  describe('street', () => {
    it('should accept valid street', async() => {
      const data = { street: 'Rua Teste' };

      const result = await target.transform(data, metadata);

      expect(result.street).toBe('Rua Teste');
    });

    it('should trim street', async() => {
      const data = { street: '  Rua Teste  ' };

      const result = await target.transform(data, metadata);

      expect(result.street).toBe('Rua Teste');
    });
  });

  describe('number', () => {
    it('should accept valid number', async() => {
      const data = { number: '123' };

      const result = await target.transform(data, metadata);

      expect(result.number).toBe('123');
    });

    it('should trim number', async() => {
      const data = { number: '  456  ' };

      const result = await target.transform(data, metadata);

      expect(result.number).toBe('456');
    });
  });

  describe('complement (optional)', () => {
    it('should accept null complement', async() => {
      const data = { complement: null };

      const result = await target.transform(data, metadata);

      expect(result.complement).toBeNull();
    });

    it('should accept string complement', async() => {
      const data = { complement: 'Apto 101' };

      const result = await target.transform(data, metadata);

      expect(result.complement).toBe('Apto 101');
    });

    it('should trim complement', async() => {
      const data = { complement: '  Sala 5  ' };

      const result = await target.transform(data, metadata);

      expect(result.complement).toBe('Sala 5');
    });
  });

  describe('neighborhood', () => {
    it('should accept valid neighborhood', async() => {
      const data = { neighborhood: 'Centro' };

      const result = await target.transform(data, metadata);

      expect(result.neighborhood).toBe('Centro');
    });
  });

  describe('city', () => {
    it('should accept valid city', async() => {
      const data = { city: 'São Paulo' };

      const result = await target.transform(data, metadata);

      expect(result.city).toBe('São Paulo');
    });
  });

  describe('state', () => {
    it('should accept valid state', async() => {
      const data = { state: 'SP' };

      const result = await target.transform(data, metadata);

      expect(result.state).toBe('SP');
    });
  });

  it('should pass with all fields provided', async() => {
    const data = {
      type: ClientAddressType.BILLING,
      zipCode: '12345-678',
      street: 'Rua Editada',
      number: '999',
      complement: 'Sala 10',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditClientAddressInputDto);
    expect(result).toEqual(data);
  });

  it('should pass with partial fields (only some provided)', async() => {
    const data = {
      street: 'Nova Rua',
      number: '42',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditClientAddressInputDto);
    expect(result.street).toBe('Nova Rua');
    expect(result.number).toBe('42');
    expect(result.type).toBeUndefined();
    expect(result.zipCode).toBeUndefined();
  });

  it('should not include clientId (omitted from DTO)', async() => {
    const data = {
      type: ClientAddressType.MAIN,
      street: 'Rua Teste',
    };

    const result = await target.transform(data, metadata);

    expect(result).not.toHaveProperty('clientId');
  });
});
