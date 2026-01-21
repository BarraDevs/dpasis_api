import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllServiceQueryDto } from './find-all-service.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllServiceQueryDto,
};

describe('FindAllServiceQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      'companyId',
      'categoryId',
      'name',
      'productId',
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
        [field]: 'valid string',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllServiceQueryDto);
      expect(result[field as keyof FindAllServiceQueryDto]).toBe('valid string');
    });

    it(`should accept undefined for ${field}`, async() => {
      // Arrange
      const data = {
        [field]: undefined,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllServiceQueryDto);
    });

    it(`should accept empty string for ${field} (treated as no filter)`, async() => {
      // Arrange
      const data = {
        [field]: '',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllServiceQueryDto);
    });

    it(`should trim whitespace for ${field}`, async() => {
      // Arrange
      const data = {
        [field]: '  value with spaces  ',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllServiceQueryDto);
      expect(result[field as keyof FindAllServiceQueryDto]).toBe('value with spaces');
    });
  });

  describe('active field (optional boolean filter)', () => {
    it.each(
      [
        'string',
        123,
        {},
        [],
      ]
    )('should throw an error if active is not a boolean (%s)', async(value: any) => {
      // Arrange
      const data = {
        active: value,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('active deve ser um valor booleano');
      });
    });

    it('should accept true for active', async() => {
      // Arrange
      const data = {
        active: true,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllServiceQueryDto);
      expect(result.active).toBe(true);
    });

    it('should accept false for active', async() => {
      // Arrange
      const data = {
        active: false,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllServiceQueryDto);
      expect(result.active).toBe(false);
    });

    it('should accept undefined for active', async() => {
      // Arrange
      const data = {
        active: undefined,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllServiceQueryDto);
      expect(result.active).toBeUndefined();
    });
  });

  describe('pagination fields (inherited from Queries)', () => {
    it('should accept page and size as numbers', async() => {
      // Arrange
      const data = {
        page: 1,
        size: 10,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllServiceQueryDto);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
    });

    it('should accept page and size as string numbers (transformed)', async() => {
      // Arrange
      const data = {
        page: '2',
        size: '20',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllServiceQueryDto);
      expect(result.page).toBe(2);
      expect(result.size).toBe(20);
    });

    it('should throw error if page is not a positive integer', async() => {
      // Arrange
      const data = {
        page: -1,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('page deve ser um número positivo');
      });
    });

    it('should throw error if size is not a positive integer', async() => {
      // Arrange
      const data = {
        size: 0,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('size deve ser um número positivo');
      });
    });

    it('should throw error if page is not an integer', async() => {
      // Arrange
      const data = {
        page: 1.5,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('page deve ser um número inteiro');
      });
    });

    it('should throw error if size is not an integer', async() => {
      // Arrange
      const data = {
        size: 10.7,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('size deve ser um número inteiro');
      });
    });
  });

  describe('search field (inherited from Queries)', () => {
    it('should accept search as string', async() => {
      // Arrange
      const data = {
        search: 'manutenção',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllServiceQueryDto);
      expect(result.search).toBe('manutenção');
    });

    it('should trim whitespace for search', async() => {
      // Arrange
      const data = {
        search: '  search term  ',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllServiceQueryDto);
      expect(result.search).toBe('search term');
    });

    it('should throw error if search is not a string', async() => {
      // Arrange
      const data = {
        search: 123,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('search deve ser um texto');
      });
    });
  });

  it('should pass without any filter', async() => {
    // Arrange
    const data = {};

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllServiceQueryDto);
  });

  it('should pass with all valid filter fields', async() => {
    // Arrange
    const data = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      categoryId: '660e8400-e29b-41d4-a716-446655440001',
      name: 'Manutenção',
      active: true,
      productId: '770e8400-e29b-41d4-a716-446655440002',
      page: 1,
      size: 10,
      search: 'preventiva',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllServiceQueryDto);
    expect(result.companyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.categoryId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.name).toBe('Manutenção');
    expect(result.active).toBe(true);
    expect(result.productId).toBe('770e8400-e29b-41d4-a716-446655440002');
    expect(result.page).toBe(1);
    expect(result.size).toBe(10);
    expect(result.search).toBe('preventiva');
  });

  it('should pass with only companyId', async() => {
    // Arrange
    const data = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllServiceQueryDto);
    expect(result.companyId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should pass with only categoryId', async() => {
    // Arrange
    const data = {
      categoryId: '660e8400-e29b-41d4-a716-446655440001',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllServiceQueryDto);
    expect(result.categoryId).toBe('660e8400-e29b-41d4-a716-446655440001');
  });

  it('should pass with only active filter', async() => {
    // Arrange
    const data = {
      active: false,
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllServiceQueryDto);
    expect(result.active).toBe(false);
  });

  it('should pass with only productId', async() => {
    // Arrange
    const data = {
      productId: '770e8400-e29b-41d4-a716-446655440002',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllServiceQueryDto);
    expect(result.productId).toBe('770e8400-e29b-41d4-a716-446655440002');
  });

  it('should pass with only name filter', async() => {
    // Arrange
    const data = {
      name: 'Instalação',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllServiceQueryDto);
    expect(result.name).toBe('Instalação');
  });

  it('should pass with combined filters', async() => {
    // Arrange
    const data = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      active: true,
      name: 'Manutenção',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllServiceQueryDto);
    expect(result.companyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.active).toBe(true);
    expect(result.name).toBe('Manutenção');
  });

  it('should trim all string fields', async() => {
    // Arrange
    const data = {
      companyId: '  550e8400-e29b-41d4-a716-446655440000  ',
      categoryId: '  660e8400-e29b-41d4-a716-446655440001  ',
      name: '  Manutenção  ',
      productId: '  770e8400-e29b-41d4-a716-446655440002  ',
      search: '  preventiva  ',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllServiceQueryDto);
    expect(result.companyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.categoryId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.name).toBe('Manutenção');
    expect(result.productId).toBe('770e8400-e29b-41d4-a716-446655440002');
    expect(result.search).toBe('preventiva');
  });

  it('should handle special characters in string fields', async() => {
    // Arrange
    const data = {
      name: 'Manutenção & Instalação',
      search: 'preventiva + corretiva',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllServiceQueryDto);
    expect(result.name).toBe('Manutenção & Instalação');
    expect(result.search).toBe('preventiva + corretiva');
  });

  it('should handle accented characters', async() => {
    // Arrange
    const data = {
      name: 'Instalação Elétrica',
      search: 'técnico',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllServiceQueryDto);
    expect(result.name).toBe('Instalação Elétrica');
    expect(result.search).toBe('técnico');
  });

  it('should handle very long strings', async() => {
    // Arrange
    const longString = 'a'.repeat(1000);
    const data = {
      name: longString,
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllServiceQueryDto);
    expect(result.name).toBe(longString);
  });

  it('should handle pagination with filters', async() => {
    // Arrange
    const data = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      active: true,
      page: 2,
      size: 15,
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllServiceQueryDto);
    expect(result.companyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.active).toBe(true);
    expect(result.page).toBe(2);
    expect(result.size).toBe(15);
  });
});
