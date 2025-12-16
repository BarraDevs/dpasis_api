import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllProductQueryDto } from './find-all-product.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllProductQueryDto,
};

describe('FindAllProductQueryDto', () => {
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
      'description',
      'manufacturerCode',
      'brand',
      'ncm',
      'ean',
    ]
  )('%s field (optional string filter)', (field: string) => {
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
      const data = {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        [field]: value,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser uma string`);
      });
    });

    it(`should accept valid string for ${field}`, async() => {
      // Arrange
      const data = {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        [field]: 'valid string',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllProductQueryDto);
      expect(result[field as keyof FindAllProductQueryDto]).toBe('valid string');
    });

    it(`should accept undefined for ${field}`, async() => {
      // Arrange
      const data = {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        [field]: undefined,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllProductQueryDto);
    });

    it(`should accept empty string for ${field} (treated as no filter)`, async() => {
      // Arrange
      const data = {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        [field]: '',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllProductQueryDto);
    });
  });

  describe('pagination fields (inherited from Queries)', () => {
    it('should accept page and size as numbers', async() => {
      // Arrange
      const data = {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        page: 1,
        size: 10,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllProductQueryDto);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
    });

    it('should accept page and size as string numbers (transformed)', async() => {
      // Arrange
      const data = {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        page: '2',
        size: '20',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllProductQueryDto);
      expect(result.page).toBe(2);
      expect(result.size).toBe(20);
    });
  });

  it('should pass with only required field (companyId)', async() => {
    // Arrange
    const data = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllProductQueryDto);
    expect(result.companyId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should pass with all valid filter fields', async() => {
    // Arrange
    const data = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'Electronics',
      group01: 'Computers',
      group02: 'Laptops',
      description: 'Gaming',
      manufacturerCode: 'MANUF001',
      brand: 'TechBrand',
      ncm: '84713012',
      ean: '7891234567890',
      page: 1,
      size: 10,
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllProductQueryDto);
    expect(result.companyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.type).toBe('Electronics');
    expect(result.group01).toBe('Computers');
    expect(result.group02).toBe('Laptops');
    expect(result.description).toBe('Gaming');
    expect(result.manufacturerCode).toBe('MANUF001');
    expect(result.brand).toBe('TechBrand');
    expect(result.ncm).toBe('84713012');
    expect(result.ean).toBe('7891234567890');
    expect(result.page).toBe(1);
    expect(result.size).toBe(10);
  });
});
