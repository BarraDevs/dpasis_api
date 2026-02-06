import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { BudgetStatus } from 'src/app/budget/enums/budget-status.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllBudgetQueryDto } from './find-all-budget.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllBudgetQueryDto,
};

describe('FindAllBudgetQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('status field', () => {
    it('should accept undefined for status', async() => {
      // Arrange
      const data = {
        status: undefined,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
    });

    it('should accept valid BudgetStatus enum value', async() => {
      // Arrange
      const data = {
        status: BudgetStatus.PENDING,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
      expect(result.status).toBe(BudgetStatus.PENDING);
    });

    it.each([
      BudgetStatus.PENDING,
      BudgetStatus.APPROVED,
      BudgetStatus.REJECTED,
      BudgetStatus.CANCELLED,
    ])('should accept %s as valid status', async(status: BudgetStatus) => {
      // Arrange
      const data = { status };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
      expect(result.status).toBe(status);
    });

    it.each([
      'InvalidStatus',
      'pending',
      'active',
      123,
      true,
      {},
      [],
    ])('should throw an error if status is invalid (%s)', async(value: any) => {
      // Arrange
      const data = { status: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('status deve ser um status válido');
      });
    });
  });

  describe.each([
    'companyId',
    'clientId',
    'sellerId',
    'shipperId',
  ])('%s field (UUID)', (field: string) => {
    it(`should accept undefined for ${field}`, async() => {
      // Arrange
      const data = {
        [field]: undefined,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
    });

    it(`should accept valid UUID for ${field}`, async() => {
      // Arrange
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const data = {
        [field]: validUuid,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
      expect(result[field as keyof FindAllBudgetQueryDto]).toBe(validUuid);
    });

    it.each([
      'invalid-uuid',
      '123',
      '550e8400-invalid',
      123,
      true,
      {},
      [],
    ])(`should throw an error if ${field} is not a valid UUID (%s)`, async(value: any) => {
      // Arrange
      const data = {
        [field]: value,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser um UUID válido`);
      });
    });

    it(`should throw an error if ${field} is an empty string`, async() => {
      // Arrange
      const data = {
        [field]: '',
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser um UUID válido`);
      });
    });

    it(`should trim whitespace from ${field}`, async() => {
      // Arrange
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const data = {
        [field]: `  ${validUuid}  `,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
      expect(result[field as keyof FindAllBudgetQueryDto]).toBe(validUuid);
    });
  });

  describe('freightType field', () => {
    it('should accept undefined for freightType', async() => {
      // Arrange
      const data = {
        freightType: undefined,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
    });

    it('should accept valid string for freightType', async() => {
      // Arrange
      const data = {
        freightType: 'CIF',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
      expect(result.freightType).toBe('CIF');
    });

    it.each([
      'CIF',
      'FOB',
      'outro',
    ])('should accept valid string values for freightType (%s)', async(value: string) => {
      // Arrange
      const data = { freightType: value };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
      expect(result.freightType).toBe(value);
    });

    it.each([
      123,
      true,
      {},
      [],
    ])('should throw an error if freightType is not a string (%s)', async(value: any) => {
      // Arrange
      const data = { freightType: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('freightType deve ser uma string');
      });
    });

    it('should trim whitespace from freightType', async() => {
      // Arrange
      const data = {
        freightType: '  CIF  ',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
      expect(result.freightType).toBe('CIF');
    });
  });

  describe.each([
    'createdAtStart',
    'createdAtEnd',
  ])('%s field (ISO8601 date)', (field: string) => {
    it(`should accept undefined for ${field}`, async() => {
      // Arrange
      const data = {
        [field]: undefined,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
    });

    it(`should accept valid ISO8601 date for ${field}`, async() => {
      // Arrange
      const validDate = '2024-01-15T10:30:00.000Z';
      const data = {
        [field]: validDate,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
      expect(result[field as keyof FindAllBudgetQueryDto]).toBe(validDate);
    });

    it.each([
      '2024-01-15T10:30:00Z',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00+00:00',
      '2024-12-31T23:59:59.999Z',
    ])(`should accept valid ISO8601 format for ${field} (%s)`, async(value: string) => {
      // Arrange
      const data = {
        [field]: value,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
      expect(result[field as keyof FindAllBudgetQueryDto]).toBe(value);
    });

    it.each([
      'invalid-date',
      '2024-13-01',
      '2024-01-32',
      '15/01/2024',
      '2024-13-15',
      123,
      true,
      {},
      [],
    ])(`should throw an error if ${field} is not ISO8601 format (%s)`, async(value: any) => {
      // Arrange
      const data = {
        [field]: value,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser uma data válida no formato ISO8601`);
      });
    });
  });

  it('should pass without any filter', async() => {
    // Arrange
    const data = {};

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
  });

  it('should pass with all valid filter fields', async() => {
    // Arrange
    const data = {
      companyId: '550e8400-e29b-41d4-a716-446655440001',
      clientId: '550e8400-e29b-41d4-a716-446655440002',
      sellerId: '550e8400-e29b-41d4-a716-446655440003',
      shipperId: '550e8400-e29b-41d4-a716-446655440004',
      freightType: 'CIF',
      status: BudgetStatus.APPROVED,
      createdAtStart: '2024-01-01T00:00:00.000Z',
      createdAtEnd: '2024-12-31T23:59:59.999Z',
      page: 2,
      size: 20,
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
    expect(result.companyId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.clientId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(result.sellerId).toBe('550e8400-e29b-41d4-a716-446655440003');
    expect(result.shipperId).toBe('550e8400-e29b-41d4-a716-446655440004');
    expect(result.freightType).toBe('CIF');
    expect(result.status).toBe(BudgetStatus.APPROVED);
    expect(result.createdAtStart).toBe('2024-01-01T00:00:00.000Z');
    expect(result.createdAtEnd).toBe('2024-12-31T23:59:59.999Z');
    expect(result.page).toBe(2);
    expect(result.size).toBe(20);
  });

  it('should apply transformations (trim) to string fields', async() => {
    // Arrange
    const data = {
      companyId: '  550e8400-e29b-41d4-a716-446655440001  ',
      clientId: '  550e8400-e29b-41d4-a716-446655440002  ',
      sellerId: '  550e8400-e29b-41d4-a716-446655440003  ',
      shipperId: '  550e8400-e29b-41d4-a716-446655440004  ',
      freightType: '  FOB  ',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
    expect(result.companyId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.clientId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(result.sellerId).toBe('550e8400-e29b-41d4-a716-446655440003');
    expect(result.shipperId).toBe('550e8400-e29b-41d4-a716-446655440004');
    expect(result.freightType).toBe('FOB');
  });

  it('should accept partial filters', async() => {
    // Arrange
    const data = {
      status: BudgetStatus.PENDING,
      companyId: '550e8400-e29b-41d4-a716-446655440001',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
    expect(result.status).toBe(BudgetStatus.PENDING);
    expect(result.companyId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.clientId).toBeUndefined();
    expect(result.sellerId).toBeUndefined();
    expect(result.shipperId).toBeUndefined();
    expect(result.freightType).toBeUndefined();
    expect(result.createdAtStart).toBeUndefined();
    expect(result.createdAtEnd).toBeUndefined();
  });

  describe('date range validation', () => {
    it('should accept createdAtStart without createdAtEnd', async() => {
      // Arrange
      const data = {
        createdAtStart: '2024-01-01T00:00:00.000Z',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
      expect(result.createdAtStart).toBe('2024-01-01T00:00:00.000Z');
      expect(result.createdAtEnd).toBeUndefined();
    });

    it('should accept createdAtEnd without createdAtStart', async() => {
      // Arrange
      const data = {
        createdAtEnd: '2024-12-31T23:59:59.999Z',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
      expect(result.createdAtStart).toBeUndefined();
      expect(result.createdAtEnd).toBe('2024-12-31T23:59:59.999Z');
    });

    it('should accept both createdAtStart and createdAtEnd', async() => {
      // Arrange
      const data = {
        createdAtStart: '2024-01-01T00:00:00.000Z',
        createdAtEnd: '2024-12-31T23:59:59.999Z',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllBudgetQueryDto);
      expect(result.createdAtStart).toBe('2024-01-01T00:00:00.000Z');
      expect(result.createdAtEnd).toBe('2024-12-31T23:59:59.999Z');
    });
  });
});
