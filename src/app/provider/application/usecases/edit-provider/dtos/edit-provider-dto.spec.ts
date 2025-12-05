import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { EditProviderInputDto } from './edit-provider.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditProviderInputDto,
};

describe('EditProviderInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      'name',
      'cnpj',
      'ie',
      'companyName',
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

  describe('type field', () => {
    it('should throw an error if type is not a valid enum value', async() => {
      // Arrange
      const data = { type: 'INVALID_TYPE' };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('type deve ser um dos valores: ' + Object.values(ProviderType).join(', '));
      });
    });

    it('should accept valid RECURRING type', async() => {
      // Arrange
      const data = { type: ProviderType.RECURRING, paymentDay: 15 };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.type).toBe(ProviderType.RECURRING);
    });

    it('should accept valid ONE_TIME type', async() => {
      // Arrange
      const data = { type: ProviderType.ONE_TIME, paymentExpirationDate: '2025-12-31' };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.type).toBe(ProviderType.ONE_TIME);
    });
  });

  describe('valueInCents field', () => {
    it('should throw an error if valueInCents is negative', async() => {
      // Arrange
      const data = { valueInCents: -1 };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('valueInCents deve ser maior ou igual a 0');
      });
    });

    it('should accept zero valueInCents', async() => {
      // Arrange
      const data = { valueInCents: 0 };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.valueInCents).toBe(0);
    });

    it('should accept positive valueInCents', async() => {
      // Arrange
      const data = { valueInCents: 10000 };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.valueInCents).toBe(10000);
    });
  });

  describe('email field', () => {
    it('should throw an error if email is not valid', async() => {
      // Arrange
      const data = { email: 'invalid-email' };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('email deve ser um email válido');
      });
    });

    it('should accept valid email', async() => {
      // Arrange
      const data = { email: 'valid@email.com' };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.email).toBe('valid@email.com');
    });
  });

  describe('paymentDay field (conditional validation)', () => {
    it('should require paymentDay when type is RECURRING', async() => {
      // Arrange
      const data = {
        type: ProviderType.RECURRING,
        paymentDay: null,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('paymentDay é obrigatório quando type é RECURRING');
      });
    });

    it('should throw an error if paymentDay is less than 1', async() => {
      // Arrange
      const data = {
        type: ProviderType.RECURRING,
        paymentDay: 0,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('paymentDay deve ser maior ou igual a 1');
      });
    });

    it('should throw an error if paymentDay is greater than 31', async() => {
      // Arrange
      const data = {
        type: ProviderType.RECURRING,
        paymentDay: 32,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('paymentDay deve ser menor ou igual a 31');
      });
    });

    it('should accept valid paymentDay between 1 and 31', async() => {
      // Arrange
      const data = {
        type: ProviderType.RECURRING,
        paymentDay: 15,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.paymentDay).toBe(15);
    });

    it('should not require paymentDay when type is ONE_TIME', async() => {
      // Arrange
      const data = {
        type: ProviderType.ONE_TIME,
        paymentExpirationDate: '2025-12-31',
        paymentDay: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.paymentDay).toBeNull();
    });

    it('should not validate paymentDay when type is not provided', async() => {
      // Arrange
      const data = {
        paymentDay: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.paymentDay).toBeNull();
    });
  });

  describe('paymentExpirationDate field (conditional validation)', () => {
    it('should require paymentExpirationDate when type is ONE_TIME', async() => {
      // Arrange
      const data = {
        type: ProviderType.ONE_TIME,
        paymentExpirationDate: null,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('paymentExpirationDate é obrigatório quando type é ONE_TIME');
      });
    });

    it('should accept valid paymentExpirationDate', async() => {
      // Arrange
      const data = {
        type: ProviderType.ONE_TIME,
        paymentExpirationDate: '2025-12-31',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.paymentExpirationDate).toBeInstanceOf(Date);
    });

    it('should not require paymentExpirationDate when type is RECURRING', async() => {
      // Arrange
      const data = {
        type: ProviderType.RECURRING,
        paymentDay: 15,
        paymentExpirationDate: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.paymentExpirationDate).toBeNull();
    });

    it('should not validate paymentExpirationDate when type is not provided', async() => {
      // Arrange
      const data = {
        paymentExpirationDate: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.paymentExpirationDate).toBeNull();
    });
  });

  describe('companyIds field', () => {
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
      const data = { companyIds: ['valid-id', 123, true] };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyIds deve ser uma string');
      });
    });

    it('should accept valid companyIds array', async() => {
      // Arrange
      const data = { companyIds: ['company-id-1', 'company-id-2'] };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.companyIds).toEqual(['company-id-1', 'company-id-2']);
    });
  });

  describe('optional fields', () => {
    it('should pass with empty object (all fields optional)', async() => {
      // Arrange
      const data = {};

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProviderInputDto);
    });

    it('should pass with partial update - name only', async() => {
      // Arrange
      const data = {
        name: 'Updated Name',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProviderInputDto);
      expect(result.name).toBe('Updated Name');
    });

    it('should pass with partial update - valueInCents only', async() => {
      // Arrange
      const data = {
        valueInCents: 20000,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProviderInputDto);
      expect(result.valueInCents).toBe(20000);
    });

    it('should pass with partial update - multiple fields', async() => {
      // Arrange
      const data = {
        name: 'Updated Name',
        valueInCents: 20000,
        email: 'new@email.com',
        city: 'New City',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProviderInputDto);
      expect(result.name).toBe('Updated Name');
      expect(result.valueInCents).toBe(20000);
      expect(result.email).toBe('new@email.com');
      expect(result.city).toBe('New City');
    });

    it('should pass with type change from RECURRING to ONE_TIME', async() => {
      // Arrange
      const data = {
        type: ProviderType.ONE_TIME,
        paymentExpirationDate: '2025-12-31',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProviderInputDto);
      expect(result.type).toBe(ProviderType.ONE_TIME);
      expect(result.paymentExpirationDate).toBeInstanceOf(Date);
    });

    it('should pass with type change from ONE_TIME to RECURRING', async() => {
      // Arrange
      const data = {
        type: ProviderType.RECURRING,
        paymentDay: 20,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProviderInputDto);
      expect(result.type).toBe(ProviderType.RECURRING);
      expect(result.paymentDay).toBe(20);
    });
  });
});
