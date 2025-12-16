import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateProductInputDto } from './create-product.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateProductInputDto,
};

describe('CreateProductInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('companyId field', () => {
    it.each(
      [
        undefined,
        null,
        '',
        '  ',
      ]
    )('should throw an error if companyId is empty (%s)', async(value: any) => {
      // Arrange
      const data = { companyId: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyId é obrigatório');
      });
    });

    it('should throw an error if companyId is not a valid UUID', async() => {
      // Arrange
      const data = { companyId: 'invalid-uuid' };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyId deve ser um UUID válido');
      });
    });
  });

  describe.each(
    [
      'type',
      'group01',
      'group02',
      'manufacturerCode',
      'brand',
      'measureUnit',
      'ncm',
      'economicBatch',
      'ean',
    ]
  )('%s field (required string with maxLength 256)', (field: string) => {
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
    )(`should throw an error if ${field} is not a string (%s)`, async(value: any) => {
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

  describe('description field (required string without maxLength)', () => {
    it.each(
      [
        undefined,
        null,
        '',
        '  ',
      ]
    )('should throw an error if description is empty (%s)', async(value: any) => {
      // Arrange
      const data = { description: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('description é obrigatório');
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
    )('should throw an error if description is not a string (%s)', async(value: any) => {
      // Arrange
      const data = { description: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('description deve ser uma string');
      });
    });
  });

  describe('currency field (required string with maxLength 10)', () => {
    it.each(
      [
        undefined,
        null,
        '',
        '  ',
      ]
    )('should throw an error if currency is empty (%s)', async(value: any) => {
      // Arrange
      const data = { currency: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('currency é obrigatório');
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
    )('should throw an error if currency is not a string (%s)', async(value: any) => {
      // Arrange
      const data = { currency: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('currency deve ser uma string');
      });
    });

    it('should throw an error if currency exceeds maximum length', async() => {
      // Arrange
      const data = { currency: 'a'.repeat(11) };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('currency deve ter no máximo 10 caracteres');
      });
    });
  });

  describe.each(
    [
      'minimumStock',
      'maximumStock',
      'warrantyDays',
      'markup',
      'marginB',
      'unitCostInCents',
      'unitPriceInCents',
    ]
  )('%s field (required integer with @Min(0))', (field: string) => {
    it(`should throw an error if ${field} is negative`, async() => {
      // Arrange
      const data = { [field]: -1 };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser maior ou igual a 0`);
      });
    });

    it(`should throw an error if ${field} is not an integer`, async() => {
      // Arrange
      const data = { [field]: 1.5 };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser um número inteiro`);
      });
    });

    it(`should accept ${field} equal to 0`, async() => {
      // Arrange
      const data = { [field]: 0 };

      // Act & Assert - should not throw for this field
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain(field);
      });
    });
  });

  describe.each(
    [
      'weightInKg',
      'heightInCm',
      'lengthInCm',
      'widthInCm',
      'exchangeRate',
    ]
  )('%s field (required number with @Min(0))', (field: string) => {
    it(`should throw an error if ${field} is negative`, async() => {
      // Arrange
      const data = { [field]: -1 };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser maior ou igual a 0`);
      });
    });

    it(`should accept ${field} equal to 0`, async() => {
      // Arrange
      const data = { [field]: 0 };

      // Act & Assert - should not throw for this field
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain(field);
      });
    });

    it(`should accept ${field} as decimal`, async() => {
      // Arrange
      const data = { [field]: 1.5 };

      // Act & Assert - should not throw for this field
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain(field);
      });
    });
  });

  describe('supplierIds field', () => {
    it.each(
      [
        undefined,
        null,
      ]
    )('should throw an error if supplierIds is empty (%s)', async(value: any) => {
      // Arrange
      const data = { supplierIds: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('supplierIds deve ser um array');
      });
    });

    it('should throw an error if supplierIds is not an array', async() => {
      // Arrange
      const data = { supplierIds: 'not-an-array' };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('supplierIds deve ser um array');
      });
    });

    it('should throw an error if supplierIds contains invalid UUIDs', async() => {
      // Arrange
      const data = { supplierIds: ['invalid-uuid'] };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('supplierIds deve conter UUIDs válidos');
      });
    });

    it('should accept empty array for supplierIds', async() => {
      // Arrange
      const data = { supplierIds: [] };

      // Act & Assert - should not throw for supplierIds field
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain('supplierIds');
      });
    });

    it('should accept valid UUIDs in supplierIds', async() => {
      // Arrange
      const data = { supplierIds: ['550e8400-e29b-41d4-a716-446655440000'] };

      // Act & Assert - should not throw for supplierIds field
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain('supplierIds');
      });
    });
  });

  describe('images field', () => {
    it.each(
      [
        undefined,
        null,
      ]
    )('should throw an error if images is empty (%s)', async(value: any) => {
      // Arrange
      const data = { images: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('images deve ser um array');
      });
    });

    it('should throw an error if images is not an array', async() => {
      // Arrange
      const data = { images: 'not-an-array' };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('images deve ser um array');
      });
    });

    it('should throw an error if images contains non-string items', async() => {
      // Arrange
      const data = { images: ['valid-string', 123, true] };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('images deve conter apenas strings');
      });
    });

    it('should accept empty array for images', async() => {
      // Arrange
      const data = { images: [] };

      // Act & Assert - should not throw for images field
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain('images');
      });
    });
  });

  describe('optional fields', () => {
    it.each(
      ['complement', 'additionalInfo']
    )('should accept null for %s', async(field: string) => {
      // Arrange
      const data = { [field]: null };

      // Act & Assert - should not throw for optional fields
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain(field);
      });
    });

    it.each(
      ['complement', 'additionalInfo']
    )('should accept undefined for %s', async(field: string) => {
      // Arrange
      const data = { [field]: undefined };

      // Act & Assert - should not throw for optional fields
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain(field);
      });
    });

    it.each(
      ['complement', 'additionalInfo']
    )('should accept valid string for %s', async(field: string) => {
      // Arrange
      const data = { [field]: 'valid string' };

      // Act & Assert - should not throw for optional fields
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain(field);
      });
    });
  });

  it('should pass if all required fields are valid', async() => {
    // Arrange
    const data = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'Produto Tipo',
      group01: 'Grupo 01',
      group02: 'Grupo 02',
      description: 'Descrição do produto teste',
      complement: 'Complemento do produto',
      manufacturerCode: 'MANUF001',
      brand: 'Marca Teste',
      measureUnit: 'UN',
      ncm: '12345678',
      economicBatch: 'BATCH001',
      minimumStock: 10,
      maximumStock: 100,
      warrantyDays: 365,
      weightInKg: 1.5,
      heightInCm: 10,
      lengthInCm: 20,
      widthInCm: 15,
      markup: 30,
      marginB: 20,
      currency: 'BRL',
      exchangeRate: 1,
      unitCostInCents: 1000,
      unitPriceInCents: 1500,
      ean: '7891234567890',
      additionalInfo: 'Informações adicionais',
      supplierIds: ['550e8400-e29b-41d4-a716-446655440001'],
      images: ['https://example.com/image1.jpg'],
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateProductInputDto);
    expect(result).toEqual(data);
  });

  it('should pass if all required fields are valid with optional fields as null', async() => {
    // Arrange
    const data = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'Produto Tipo',
      group01: 'Grupo 01',
      group02: 'Grupo 02',
      description: 'Descrição do produto teste',
      complement: null,
      manufacturerCode: 'MANUF001',
      brand: 'Marca Teste',
      measureUnit: 'UN',
      ncm: '12345678',
      economicBatch: 'BATCH001',
      minimumStock: 10,
      maximumStock: 100,
      warrantyDays: 365,
      weightInKg: 1.5,
      heightInCm: 10,
      lengthInCm: 20,
      widthInCm: 15,
      markup: 30,
      marginB: 20,
      currency: 'BRL',
      exchangeRate: 1,
      unitCostInCents: 1000,
      unitPriceInCents: 1500,
      ean: '7891234567890',
      additionalInfo: null,
      supplierIds: [],
      images: [],
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateProductInputDto);
    expect(result.complement).toBeNull();
    expect(result.additionalInfo).toBeNull();
  });

  it('should pass with zero values for numeric fields', async() => {
    // Arrange
    const data = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'Produto Tipo',
      group01: 'Grupo 01',
      group02: 'Grupo 02',
      description: 'Descrição do produto teste',
      complement: null,
      manufacturerCode: 'MANUF001',
      brand: 'Marca Teste',
      measureUnit: 'UN',
      ncm: '12345678',
      economicBatch: 'BATCH001',
      minimumStock: 0,
      maximumStock: 0,
      warrantyDays: 0,
      weightInKg: 0,
      heightInCm: 0,
      lengthInCm: 0,
      widthInCm: 0,
      markup: 0,
      marginB: 0,
      currency: 'BRL',
      exchangeRate: 0,
      unitCostInCents: 0,
      unitPriceInCents: 0,
      ean: '7891234567890',
      additionalInfo: null,
      supplierIds: [],
      images: [],
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateProductInputDto);
    expect(result.minimumStock).toBe(0);
    expect(result.maximumStock).toBe(0);
    expect(result.warrantyDays).toBe(0);
    expect(result.weightInKg).toBe(0);
    expect(result.heightInCm).toBe(0);
    expect(result.lengthInCm).toBe(0);
    expect(result.widthInCm).toBe(0);
    expect(result.markup).toBe(0);
    expect(result.marginB).toBe(0);
    expect(result.exchangeRate).toBe(0);
    expect(result.unitCostInCents).toBe(0);
    expect(result.unitPriceInCents).toBe(0);
  });
});
