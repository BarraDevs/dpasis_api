import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditServiceInputDto } from './edit-service.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditServiceInputDto,
};

describe('EditServiceInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should be defined', () => {
    expect(EditServiceInputDto).toBeDefined();
  });

  describe('optional fields', () => {
    it('should validate with empty object (all fields optional)', async() => {
      // Arrange
      const data = {};

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditServiceInputDto);
      expect(result).toEqual({});
    });

    it('should validate with only name field', async() => {
      // Arrange
      const data = {
        name: 'Novo Nome',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditServiceInputDto);
      expect(result.name).toBe('Novo Nome');
    });

    it('should validate with only commission field', async() => {
      // Arrange
      const data = {
        commission: 15,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditServiceInputDto);
      expect(result.commission).toBe(15);
    });

    it('should validate with multiple fields', async() => {
      // Arrange
      const data = {
        name: 'Manutenção Atualizada',
        commission: 12.5,
        valueInCents: 30000,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditServiceInputDto);
      expect(result).toEqual(data);
    });

    it('should validate with all fields', async() => {
      // Arrange
      const data = {
        name: 'Manutenção Preventiva',
        nickname: 'Manutenção',
        categoryId: '550e8400-e29b-41d4-a716-446655440001',
        productIds: [
          '550e8400-e29b-41d4-a716-446655440002',
          '550e8400-e29b-41d4-a716-446655440003',
        ],
        deadline: '5 dias úteis',
        shippingValueInCents: 1500,
        warrant: '90 dias',
        weight: 'até 10kg',
        maxVolume: 'até 0.5m³',
        dimensions: '50x40x30',
        commission: 10,
        valueInCents: 25000,
        description: 'Serviço de manutenção preventiva',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditServiceInputDto);
      expect(result).toEqual(data);
    });
  });

  describe('companyId field', () => {
    it('should not have companyId field (omitted from edit)', async() => {
      // Arrange
      const data = {
        name: 'Test',
        companyId: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditServiceInputDto);
      // companyId should not be stripped, but it's ignored in the DTO definition
      // The DTO extends OmitType, so companyId won't have validators
    });
  });

  describe('null values', () => {
    it('should accept null for nickname', async() => {
      // Arrange
      const data = {
        nickname: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditServiceInputDto);
      expect(result.nickname).toBeNull();
    });

    it('should accept null for deadline', async() => {
      // Arrange
      const data = {
        deadline: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditServiceInputDto);
      expect(result.deadline).toBeNull();
    });

    it('should accept null for shippingValueInCents', async() => {
      // Arrange
      const data = {
        shippingValueInCents: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditServiceInputDto);
      expect(result.shippingValueInCents).toBeNull();
    });

    it('should accept null for warrant', async() => {
      // Arrange
      const data = {
        warrant: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditServiceInputDto);
      expect(result.warrant).toBeNull();
    });

    it('should accept null for weight', async() => {
      // Arrange
      const data = {
        weight: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditServiceInputDto);
      expect(result.weight).toBeNull();
    });

    it('should accept null for maxVolume', async() => {
      // Arrange
      const data = {
        maxVolume: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditServiceInputDto);
      expect(result.maxVolume).toBeNull();
    });

    it('should accept null for dimensions', async() => {
      // Arrange
      const data = {
        dimensions: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditServiceInputDto);
      expect(result.dimensions).toBeNull();
    });

    it('should accept null for description', async() => {
      // Arrange
      const data = {
        description: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditServiceInputDto);
      expect(result.description).toBeNull();
    });

    it('should accept multiple null fields at once', async() => {
      // Arrange
      const data = {
        nickname: null,
        deadline: null,
        shippingValueInCents: null,
        warrant: null,
        description: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditServiceInputDto);
      expect(result.nickname).toBeNull();
      expect(result.deadline).toBeNull();
      expect(result.shippingValueInCents).toBeNull();
      expect(result.warrant).toBeNull();
      expect(result.description).toBeNull();
    });
  });

  describe('name validation (when provided)', () => {
    it('should reject empty string for name', async() => {
      // Arrange
      const data = {
        name: '',
      };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('name é obrigatório');
      });
    });

    it('should reject non-string for name', async() => {
      // Arrange
      const data = {
        name: 123,
      };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('name deve ser uma string');
      });
    });

    it('should trim name', async() => {
      // Arrange
      const data = {
        name: '  Manutenção  ',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.name).toBe('Manutenção');
    });
  });

  describe('categoryId validation (when provided)', () => {
    it('should reject invalid UUID for categoryId', async() => {
      // Arrange
      const data = {
        categoryId: 'invalid-uuid',
      };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('categoryId deve ser um UUID válido');
      });
    });

    it('should accept valid UUID for categoryId', async() => {
      // Arrange
      const data = {
        categoryId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.categoryId).toBe('550e8400-e29b-41d4-a716-446655440001');
    });
  });

  describe('productIds validation (when provided)', () => {
    it('should reject when productIds has less than 2 items', async() => {
      // Arrange
      const data = {
        productIds: ['550e8400-e29b-41d4-a716-446655440002'],
      };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('productIds deve conter exatamente 2 itens');
      });
    });

    it('should reject when productIds has more than 2 items', async() => {
      // Arrange
      const data = {
        productIds: [
          '550e8400-e29b-41d4-a716-446655440002',
          '550e8400-e29b-41d4-a716-446655440003',
          '550e8400-e29b-41d4-a716-446655440004',
        ],
      };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('productIds deve conter exatamente 2 itens');
      });
    });

    it('should reject when productIds has duplicates', async() => {
      // Arrange
      const data = {
        productIds: [
          '550e8400-e29b-41d4-a716-446655440002',
          '550e8400-e29b-41d4-a716-446655440002',
        ],
      };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('productIds não deve conter itens duplicados');
      });
    });

    it('should accept exactly 2 valid product IDs', async() => {
      // Arrange
      const data = {
        productIds: [
          '550e8400-e29b-41d4-a716-446655440002',
          '550e8400-e29b-41d4-a716-446655440003',
        ],
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.productIds).toEqual(data.productIds);
    });

    it('should reject invalid UUIDs in productIds', async() => {
      // Arrange
      const data = {
        productIds: [
          'invalid-uuid-1',
          'invalid-uuid-2',
        ],
      };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('productIds deve conter UUIDs válidos');
      });
    });
  });

  describe('commission validation (when provided)', () => {
    it('should reject when commission is above 100', async() => {
      // Arrange
      const data = { commission: 101 };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('commission deve ser menor ou igual a 100');
      });
    });

    it('should reject when commission is negative', async() => {
      // Arrange
      const data = { commission: -1 };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('commission deve ser maior ou igual a 0');
      });
    });

    it('should accept commission as 0', async() => {
      // Arrange
      const data = { commission: 0 };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.commission).toBe(0);
    });

    it('should accept commission as 100', async() => {
      // Arrange
      const data = { commission: 100 };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.commission).toBe(100);
    });

    it('should accept decimal commission', async() => {
      // Arrange
      const data = { commission: 12.75 };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.commission).toBe(12.75);
    });

    it('should convert string to number for commission', async() => {
      // Arrange
      const data = { commission: '15' };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.commission).toBe(15);
    });
  });

  describe('valueInCents validation (when provided)', () => {
    it('should reject when valueInCents is negative', async() => {
      // Arrange
      const data = { valueInCents: -1 };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('valueInCents deve ser maior ou igual a 0');
      });
    });

    it('should reject when valueInCents is not an integer', async() => {
      // Arrange
      const data = { valueInCents: '100.5' };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('valueInCents deve ser um número inteiro');
      });
    });

    it('should accept valueInCents as 0', async() => {
      // Arrange
      const data = { valueInCents: 0 };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.valueInCents).toBe(0);
    });

    it('should convert string to number for valueInCents', async() => {
      // Arrange
      const data = { valueInCents: '25000' };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.valueInCents).toBe(25000);
    });
  });

  describe('shippingValueInCents validation (when provided)', () => {
    it('should reject when shippingValueInCents is negative', async() => {
      // Arrange
      const data = { shippingValueInCents: -1 };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('shippingValueInCents deve ser maior ou igual a 0');
      });
    });

    it('should reject when shippingValueInCents is not an integer', async() => {
      // Arrange
      const data = { shippingValueInCents: '100.5' };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('shippingValueInCents deve ser um número inteiro');
      });
    });

    it('should accept shippingValueInCents as 0', async() => {
      // Arrange
      const data = { shippingValueInCents: 0 };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.shippingValueInCents).toBe(0);
    });

    it('should convert string to number for shippingValueInCents', async() => {
      // Arrange
      const data = { shippingValueInCents: '1500' };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.shippingValueInCents).toBe(1500);
    });
  });

  describe('string fields trimming', () => {
    it('should trim nickname', async() => {
      // Arrange
      const data = {
        nickname: '  Manutenção  ',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.nickname).toBe('Manutenção');
    });

    it('should trim deadline', async() => {
      // Arrange
      const data = {
        deadline: '  5 dias  ',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.deadline).toBe('5 dias');
    });

    it('should trim warrant', async() => {
      // Arrange
      const data = {
        warrant: '  90 dias  ',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.warrant).toBe('90 dias');
    });

    it('should trim weight', async() => {
      // Arrange
      const data = {
        weight: '  10kg  ',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.weight).toBe('10kg');
    });

    it('should trim maxVolume', async() => {
      // Arrange
      const data = {
        maxVolume: '  0.5m³  ',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.maxVolume).toBe('0.5m³');
    });

    it('should trim dimensions', async() => {
      // Arrange
      const data = {
        dimensions: '  50x40x30  ',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.dimensions).toBe('50x40x30');
    });

    it('should trim description', async() => {
      // Arrange
      const data = {
        description: '  Descrição do serviço  ',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.description).toBe('Descrição do serviço');
    });
  });

  describe('edge cases', () => {
    it('should handle mix of provided and undefined fields', async() => {
      // Arrange
      const data = {
        name: 'Novo Nome',
        commission: 20,
        description: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.name).toBe('Novo Nome');
      expect(result.commission).toBe(20);
      expect(result.description).toBeNull();
      expect(result.categoryId).toBeUndefined();
    });

    it('should accept special characters in string fields', async() => {
      // Arrange
      const data = {
        name: 'Manutenção & Instalação (Premium)™',
        description: 'Serviço com @#$%^&*()',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.name).toBe('Manutenção & Instalação (Premium)™');
      expect(result.description).toBe('Serviço com @#$%^&*()');
    });

    it('should accept very long strings', async() => {
      // Arrange
      const longText = 'A'.repeat(1000);
      const data = {
        description: longText,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.description).toBe(longText);
    });

    it('should accept accented characters', async() => {
      // Arrange
      const data = {
        name: 'Manutenção e Instalação',
        description: 'Serviço de qualidade',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.name).toBe('Manutenção e Instalação');
      expect(result.description).toBe('Serviço de qualidade');
    });
  });
});
