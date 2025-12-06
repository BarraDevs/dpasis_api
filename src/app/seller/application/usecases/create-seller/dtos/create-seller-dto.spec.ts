import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { CreateSellerInputDto } from './create-seller.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateSellerInputDto,
};

describe('CreateSellerInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      'name',
      'phone',
      'cellphone',
      'zipCode',
      'street',
      'number',
      'neighborhood',
      'city',
      'state',
    ]
  )('%s field', (field: string) => {
    it.each(
      [
        undefined,
        null,
        '',
        '  ',
      ]
    )(`should throw an error if ${field} is empty (%s)`, async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} é obrigatório`);
      });
    });

    it.each(
      [
        123,
        true,
        false,
        {},
        [],
      ]
    )('should throw an error if %s is not a string (%s)', async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser uma string`);
      });
    });

    it(`should throw an error if ${field} exceeds maximum length`, async() => {
      // Arrange
      const data = { [field]: 'a'.repeat(257) };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ter no máximo 256 caracteres`);
      });
    });
  });

  describe('nickname field', () => {
    it.each(
      [
        null,
        undefined,
      ]
    )('should accept %s for nickname', async(value: any) => {
      // Arrange
      const validData = {
        name: 'John Doe',
        nickname: value,
        phone: '1122223333',
        cellphone: '11999998888',
        email: 'john@example.com',
        commission: 10,
        zipCode: '01310100',
        street: 'Avenida Paulista',
        number: '1000',
        complement: null,
        reference: null,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        observation: null,
        avatarUrl: null,
        companyIds: ['company-id-1'],
      };

      // Act
      const result = await target.transform(validData, metadata);

      // Assert
      expect(result.nickname).toBe(value);
    });

    it('should accept a valid nickname string', async() => {
      // Arrange
      const validData = {
        name: 'John Doe',
        nickname: 'Johnny',
        phone: '1122223333',
        cellphone: '11999998888',
        email: 'john@example.com',
        commission: 10,
        zipCode: '01310100',
        street: 'Avenida Paulista',
        number: '1000',
        complement: null,
        reference: null,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        observation: null,
        avatarUrl: null,
        companyIds: ['company-id-1'],
      };

      // Act
      const result = await target.transform(validData, metadata);

      // Assert
      expect(result.nickname).toBe('Johnny');
    });

    it.each([123, true, false, {}, []])('should throw an error if nickname is not a string (%s)', async(value: any) => {
      // Arrange
      const data = { nickname: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('nickname deve ser uma string');
      });
    });

    it('should throw an error if nickname exceeds maximum length', async() => {
      // Arrange
      const data = { nickname: 'a'.repeat(257) };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('nickname deve ter no máximo 256 caracteres');
      });
    });

    it('should trim nickname value', async() => {
      // Arrange
      const validData = {
        name: 'John Doe',
        nickname: '  Johnny  ',
        phone: '1122223333',
        cellphone: '11999998888',
        email: 'john@example.com',
        commission: 10,
        zipCode: '01310100',
        street: 'Avenida Paulista',
        number: '1000',
        complement: null,
        reference: null,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        observation: null,
        avatarUrl: null,
        companyIds: ['company-id-1'],
      };

      // Act
      const result = await target.transform(validData, metadata);

      // Assert
      expect(result.nickname).toBe('Johnny');
    });

    it('should accept empty string for nickname and trim it', async() => {
      // Arrange
      const validData = {
        name: 'John Doe',
        nickname: '   ',
        phone: '1122223333',
        cellphone: '11999998888',
        email: 'john@example.com',
        commission: 10,
        zipCode: '01310100',
        street: 'Avenida Paulista',
        number: '1000',
        complement: null,
        reference: null,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        observation: null,
        avatarUrl: null,
        companyIds: ['company-id-1'],
      };

      // Act
      const result = await target.transform(validData, metadata);

      // Assert
      expect(result.nickname).toBe('');
    });
  });

  describe('email field', () => {
    it.each(
      [
        undefined,
        null,
        '',
        '  ',
      ]
    )('should throw an error if email is empty (%s)', async(value: any) => {
      // Arrange
      const data = { email: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('email é obrigatório');
      });
    });

    it('should throw an error if email is not valid', async() => {
      // Arrange
      const data = { email: 'invalid-email' };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('email deve ser um email válido');
      });
    });
  });

  describe('commission field', () => {
    it.each(
      [
        undefined,
        null,
      ]
    )('should throw an error if commission is empty (%s)', async(value: any) => {
      // Arrange
      const data = { commission: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('commission é obrigatório');
      });
    });

    it('should throw an error if commission is negative', async() => {
      // Arrange
      const data = { commission: -1 };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('commission deve ser maior ou igual a 0');
      });
    });

    it('should throw an error if commission is greater than 100', async() => {
      // Arrange
      const data = { commission: 101 };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('commission deve ser menor ou igual a 100');
      });
    });

    it('should accept commission equal to 0', async() => {
      // Arrange
      const data = { commission: 0 };

      // Act & Assert - should not throw for commission field
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain('commission');
      });
    });

    it('should accept commission equal to 100', async() => {
      // Arrange
      const data = { commission: 100 };

      // Act & Assert - should not throw for commission field
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain('commission');
      });
    });
  });

  describe('companyIds field', () => {
    it.each(
      [
        undefined,
        null,
      ]
    )('should throw an error if companyIds is empty (%s)', async(value: any) => {
      // Arrange
      const data = { companyIds: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyIds deve ser um array');
      });
    });

    it('should throw an error if companyIds is not an array', async() => {
      // Arrange
      const data = { companyIds: 'not-an-array' };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyIds deve ser um array');
      });
    });

    it('should throw an error if companyIds is an empty array', async() => {
      // Arrange
      const data = { companyIds: [] };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyIds deve ter ao menos 1 item');
      });
    });

    it('should throw an error if companyIds contains non-string items', async() => {
      // Arrange
      const data = { companyIds: ['valid-string', 123, true] };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyIds deve ser uma string');
      });
    });
  });

  describe('optional fields', () => {
    it.each(['complement', 'reference', 'observation', 'avatarUrl'])(
      'should accept null for %s',
      async(field: string) => {
        // Arrange
        const validData = {
          name: 'John Doe',
          nickname: 'Johnny',
          phone: '1122223333',
          cellphone: '11999998888',
          email: 'john@example.com',
          commission: 10,
          zipCode: '01310100',
          street: 'Avenida Paulista',
          number: '1000',
          complement: null,
          reference: null,
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          observation: null,
          avatarUrl: null,
          companyIds: ['company-id-1'],
        };

        // Act
        const result = await target.transform(validData, metadata);

        // Assert
        expect(result[field]).toBeNull();
      },
    );
  });

  it('should pass if all required fields are valid', async() => {
    // Arrange
    const data = {
      name: 'John Doe',
      nickname: 'Johnny',
      phone: '1122223333',
      cellphone: '11999998888',
      email: 'john@example.com',
      commission: 10,
      zipCode: '01310100',
      street: 'Avenida Paulista',
      number: '1000',
      complement: 'Sala 101',
      reference: 'Próximo ao metrô',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      observation: 'Vendedor experiente',
      avatarUrl: 'https://example.com/avatar.jpg',
      companyIds: ['company-id-1', 'company-id-2'],
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateSellerInputDto);
    expect(result).toEqual(data);
  });
});
