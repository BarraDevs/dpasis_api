import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditProductInputDto } from './edit-product.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditProductInputDto,
};

describe('EditProductInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('string fields validation (inherited from CreateProductInputDto)', () => {
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
    )('%s field (optional string with maxLength 256)', (field: string) => {
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

      it(`should accept valid string for ${field}`, async() => {
        // Arrange
        const data = { [field]: 'valid string' };

        // Act & Assert - should not throw for this field
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).not.toContain(field);
        });
      });

      it(`should accept undefined for ${field}`, async() => {
        // Arrange
        const data = { [field]: undefined };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result).toBeInstanceOf(EditProductInputDto);
      });
    });
  });

  describe('description field (optional string without maxLength)', () => {
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

    it('should accept valid string for description', async() => {
      // Arrange
      const data = { description: 'valid description' };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
      expect(result.description).toBe('valid description');
    });

    it('should accept undefined for description', async() => {
      // Arrange
      const data = { description: undefined };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
    });
  });

  describe('currency field (optional string with maxLength 10)', () => {
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

    it('should accept valid string for currency', async() => {
      // Arrange
      const data = { currency: 'BRL' };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
      expect(result.currency).toBe('BRL');
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
  )('%s field (optional integer with @Min(0))', (field: string) => {
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

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
      expect(result[field as keyof EditProductInputDto]).toBe(0);
    });

    it(`should accept undefined for ${field}`, async() => {
      // Arrange
      const data = { [field]: undefined };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
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
  )('%s field (optional number with @Min(0))', (field: string) => {
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

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
      expect(result[field as keyof EditProductInputDto]).toBe(0);
    });

    it(`should accept ${field} as decimal`, async() => {
      // Arrange
      const data = { [field]: 1.5 };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
      expect(result[field as keyof EditProductInputDto]).toBe(1.5);
    });

    it(`should accept undefined for ${field}`, async() => {
      // Arrange
      const data = { [field]: undefined };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
    });
  });

  describe('supplierIds field', () => {
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

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
      expect(result.supplierIds).toEqual([]);
    });

    it('should accept valid UUIDs in supplierIds', async() => {
      // Arrange
      const data = { supplierIds: ['550e8400-e29b-41d4-a716-446655440000'] };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
      expect(result.supplierIds).toEqual(['550e8400-e29b-41d4-a716-446655440000']);
    });

    it('should accept undefined for supplierIds', async() => {
      // Arrange
      const data = { supplierIds: undefined };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
    });
  });

  describe('images field', () => {
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

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
      expect(result.images).toEqual([]);
    });

    it('should accept valid strings in images', async() => {
      // Arrange
      const data = { images: ['https://example.com/image.jpg'] };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
      expect(result.images).toEqual(['https://example.com/image.jpg']);
    });

    it('should accept undefined for images', async() => {
      // Arrange
      const data = { images: undefined };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
    });
  });

  describe('optional fields (complement, additionalInfo)', () => {
    it.each(
      ['complement', 'additionalInfo']
    )('should accept null for %s', async(field: string) => {
      // Arrange
      const data = { [field]: null };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
    });

    it.each(
      ['complement', 'additionalInfo']
    )('should accept undefined for %s', async(field: string) => {
      // Arrange
      const data = { [field]: undefined };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
    });

    it.each(
      ['complement', 'additionalInfo']
    )('should accept valid string for %s', async(field: string) => {
      // Arrange
      const data = { [field]: 'valid string' };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditProductInputDto);
      expect(result[field as keyof EditProductInputDto]).toBe('valid string');
    });
  });

  describe('companyId should not be allowed', () => {
    it('should not have companyId field', async() => {
      // Arrange - companyId is omitted from EditProductInputDto
      const data = { companyId: '550e8400-e29b-41d4-a716-446655440000' };

      // Act
      const result = await target.transform(data, metadata);

      // Assert - companyId should not be present in result
      expect(result).toBeInstanceOf(EditProductInputDto);
      expect((result as any).companyId).toBeUndefined();
    });
  });

  it('should pass with empty object (all fields are optional)', async() => {
    // Arrange
    const data = {};

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditProductInputDto);
  });

  it('should pass with valid partial data', async() => {
    // Arrange
    const data = {
      type: 'Novo Tipo',
      brand: 'Nova Marca',
      unitPriceInCents: 2000,
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditProductInputDto);
    expect(result.type).toBe('Novo Tipo');
    expect(result.brand).toBe('Nova Marca');
    expect(result.unitPriceInCents).toBe(2000);
  });

  it('should pass with all valid fields', async() => {
    // Arrange
    const data = {
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
    expect(result).toBeInstanceOf(EditProductInputDto);
    expect(result).toEqual(data);
  });
});
