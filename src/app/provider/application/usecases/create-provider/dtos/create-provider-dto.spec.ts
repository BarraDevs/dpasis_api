import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { CreateProviderInputDto } from './create-provider.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateProviderInputDto,
};

describe('CreateProviderInputDto', () => {
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

  describe('type field', () => {
    it.each(
      [
        undefined,
        null,
        '',
        '  ',
      ]
    )('should throw an error if type is empty (%s)', async(value: any) => {
      // Arrange
      const data = { type: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('type é obrigatório');
      });
    });

    it('should throw an error if type is not a valid enum value', async() => {
      // Arrange
      const data = { type: 'INVALID_TYPE' };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('type deve ser um dos valores: ' + Object.values(ProviderType).join(', '));
      });
    });
  });

  describe('valueInCents field', () => {
    it.each(
      [
        undefined,
        null,
      ]
    )('should throw an error if valueInCents is empty (%s)', async(value: any) => {
      // Arrange
      const data = { valueInCents: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('valueInCents é obrigatório');
      });
    });

    it('should throw an error if valueInCents is negative', async() => {
      // Arrange
      const data = { valueInCents: -1 };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('valueInCents deve ser maior ou igual a 0');
      });
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

  it('should pass if all required fields are valid for RECURRING type', async() => {
    // Arrange
    const data = {
      name: 'Provider Name',
      type: ProviderType.RECURRING,
      valueInCents: 10000,
      cnpj: '11222333000181',
      ie: '123456789',
      paymentDay: 15,
      paymentExpirationDate: null,
      companyName: 'Company Name',
      zipCode: '12345678',
      street: 'Main Street',
      number: '100',
      complement: null,
      reference: null,
      neighborhood: 'Downtown',
      city: 'São Paulo',
      state: 'SP',
      email: 'provider@email.com',
      website: null,
      companyIds: ['company-id-1'],
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateProviderInputDto);
    expect(result).toEqual(data);
  });

  it('should pass if all required fields are valid for ONE_TIME type', async() => {
    // Arrange
    const data = {
      name: 'Provider Name',
      type: ProviderType.ONE_TIME,
      valueInCents: 10000,
      cnpj: '11222333000181',
      ie: '123456789',
      paymentDay: null,
      paymentExpirationDate: '2025-12-31',
      companyName: 'Company Name',
      zipCode: '12345678',
      street: 'Main Street',
      number: '100',
      complement: 'Suite 100',
      reference: 'Near the park',
      neighborhood: 'Downtown',
      city: 'São Paulo',
      state: 'SP',
      email: 'provider@email.com',
      website: 'https://provider.com',
      companyIds: ['company-id-1', 'company-id-2'],
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateProviderInputDto);
    expect(result.paymentExpirationDate).toBeInstanceOf(Date);
  });
});
