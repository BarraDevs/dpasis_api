import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { OrderStatus } from 'src/app/order/enums/order-status.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllOrdersQueryDto } from './find-all-orders.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllOrdersQueryDto,
};

describe('FindAllOrdersQueryDto', () => {
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
      expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
    });

    it('should accept valid OrderStatus enum value', async() => {
      // Arrange
      const data = {
        status: OrderStatus.CREATED,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
      expect(result.status).toBe(OrderStatus.CREATED);
    });

    it.each([
      OrderStatus.CREATED,
      OrderStatus.PRODUCTION,
      OrderStatus.INVOICED,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ])('should accept %s as valid status', async(status: OrderStatus) => {
      // Arrange
      const data = { status };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
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
    'clientId',
    'sellerId',
    'companyId',
  ])('%s field (UUID)', (field: string) => {
    it(`should accept undefined for ${field}`, async() => {
      // Arrange
      const data = {
        [field]: undefined,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
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
      expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
      expect(result[field as keyof FindAllOrdersQueryDto]).toBe(validUuid);
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
      expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
      expect(result[field as keyof FindAllOrdersQueryDto]).toBe(validUuid);
    });
  });

  describe.each([
    'dateFrom',
    'dateTo',
  ])('%s field (ISO8601 date)', (field: string) => {
    it(`should accept undefined for ${field}`, async() => {
      // Arrange
      const data = {
        [field]: undefined,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
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
      expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
      expect(result[field as keyof FindAllOrdersQueryDto]).toBe(validDate);
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
      expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
      expect(result[field as keyof FindAllOrdersQueryDto]).toBe(value);
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
    expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
  });

  it('should pass with all valid filter fields', async() => {
    // Arrange
    const data = {
      status: OrderStatus.PRODUCTION,
      clientId: '550e8400-e29b-41d4-a716-446655440001',
      sellerId: '550e8400-e29b-41d4-a716-446655440002',
      companyId: '550e8400-e29b-41d4-a716-446655440003',
      dateFrom: '2024-01-01T00:00:00.000Z',
      dateTo: '2024-12-31T23:59:59.999Z',
      page: 2,
      size: 20,
      search: 'test',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
    expect(result.status).toBe(OrderStatus.PRODUCTION);
    expect(result.clientId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.sellerId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(result.companyId).toBe('550e8400-e29b-41d4-a716-446655440003');
    expect(result.dateFrom).toBe('2024-01-01T00:00:00.000Z');
    expect(result.dateTo).toBe('2024-12-31T23:59:59.999Z');
    expect(result.page).toBe(2);
    expect(result.size).toBe(20);
    expect(result.search).toBe('test');
  });

  it('should apply transformations (trim) to string fields', async() => {
    // Arrange
    const data = {
      clientId: '  550e8400-e29b-41d4-a716-446655440001  ',
      sellerId: '  550e8400-e29b-41d4-a716-446655440002  ',
      companyId: '  550e8400-e29b-41d4-a716-446655440003  ',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
    expect(result.clientId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.sellerId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(result.companyId).toBe('550e8400-e29b-41d4-a716-446655440003');
  });

  it('should accept partial filters', async() => {
    // Arrange
    const data = {
      status: OrderStatus.CREATED,
      clientId: '550e8400-e29b-41d4-a716-446655440001',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
    expect(result.status).toBe(OrderStatus.CREATED);
    expect(result.clientId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.sellerId).toBeUndefined();
    expect(result.companyId).toBeUndefined();
    expect(result.dateFrom).toBeUndefined();
    expect(result.dateTo).toBeUndefined();
  });

  describe('date range validation', () => {
    it('should accept dateFrom without dateTo', async() => {
      // Arrange
      const data = {
        dateFrom: '2024-01-01T00:00:00.000Z',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
      expect(result.dateFrom).toBe('2024-01-01T00:00:00.000Z');
      expect(result.dateTo).toBeUndefined();
    });

    it('should accept dateTo without dateFrom', async() => {
      // Arrange
      const data = {
        dateTo: '2024-12-31T23:59:59.999Z',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
      expect(result.dateFrom).toBeUndefined();
      expect(result.dateTo).toBe('2024-12-31T23:59:59.999Z');
    });

    it('should accept both dateFrom and dateTo', async() => {
      // Arrange
      const data = {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-12-31T23:59:59.999Z',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllOrdersQueryDto);
      expect(result.dateFrom).toBe('2024-01-01T00:00:00.000Z');
      expect(result.dateTo).toBe('2024-12-31T23:59:59.999Z');
    });
  });
});
