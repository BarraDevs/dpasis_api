import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllAuditLogQueryDto } from './find-all-audit-log.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllAuditLogQueryDto,
};

function makeValidQueryDto(
  overrides: Partial<FindAllAuditLogQueryDto> = {},
): FindAllAuditLogQueryDto {
  return {
    ...overrides,
  } as FindAllAuditLogQueryDto;
}

describe('FindAllAuditLogQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should pass with empty query', async() => {
    // Arrange
    const data = makeValidQueryDto({});

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllAuditLogQueryDto);
  });

  it('should pass with all valid fields', async() => {
    // Arrange
    const data = makeValidQueryDto({
      page: 1,
      size: 10,
      search: '/admin/client',
      accountId: 5,
      method: 'POST',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    });

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toEqual(data);
  });

  describe('accountId field', () => {
    it('should be optional', async() => {
      // Arrange
      const data = makeValidQueryDto({});

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.accountId).toBeUndefined();
    });

    it('should accept valid accountId', async() => {
      // Arrange
      const data = makeValidQueryDto({ accountId: 5 });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.accountId).toBe(5);
    });

    it('should transform string accountId to number', async() => {
      // Arrange
      const data = { ...makeValidQueryDto(), accountId: '5' as any };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.accountId).toBe(5);
    });

    it.each([0, -1])('should reject non-positive accountId (%s)', async(value: number) => {
      // Arrange
      const data = makeValidQueryDto({ accountId: value });

      // Act / Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('accountId deve ser um número positivo');
      });
    });

    it.each([1.5, 'abc', true])('should reject non-integer accountId (%s)', async(value: any) => {
      // Arrange
      const data = { ...makeValidQueryDto(), accountId: value };

      // Act / Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('accountId deve ser um número inteiro');
      });
    });
  });

  describe('method field', () => {
    it('should be optional', async() => {
      // Arrange
      const data = makeValidQueryDto({});

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.method).toBeUndefined();
    });

    it.each(['POST', 'PATCH', 'PUT', 'DELETE', 'JOB'])('should accept method %s', async(method: string) => {
      // Arrange
      const data = makeValidQueryDto({ method });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.method).toBe(method);
    });

    it('should trim method', async() => {
      // Arrange
      const data = makeValidQueryDto({ method: '  POST  ' });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.method).toBe('POST');
    });

    it('should reject invalid method', async() => {
      // Arrange
      const data = makeValidQueryDto({ method: 'GET' });

      // Act / Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('method deve ser POST, PATCH, PUT, DELETE ou JOB');
      });
    });

    it.each([1, true, {}])('should reject non-string method (%s)', async(value: any) => {
      // Arrange
      const data = { ...makeValidQueryDto(), method: value };

      // Act / Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('method deve ser uma string');
      });
    });
  });

  describe('startDate field', () => {
    it('should be optional', async() => {
      // Arrange
      const data = makeValidQueryDto({});

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.startDate).toBeUndefined();
    });

    it('should accept valid ISO date', async() => {
      // Arrange
      const data = makeValidQueryDto({ startDate: '2025-01-01' });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.startDate).toBe('2025-01-01');
    });

    it.each(['01/01/2025', 'not-a-date', 123])(
      'should reject invalid startDate (%s)',
      async(value: any) => {
        // Arrange
        const data = { ...makeValidQueryDto(), startDate: value };

        // Act / Assert
        expect.assertions(1);
        await target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(
            'startDate deve ser uma data válida no formato ISO 8601',
          );
        });
      },
    );
  });

  describe('endDate field', () => {
    it('should be optional', async() => {
      // Arrange
      const data = makeValidQueryDto({});

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.endDate).toBeUndefined();
    });

    it('should accept valid ISO date', async() => {
      // Arrange
      const data = makeValidQueryDto({ endDate: '2025-12-31' });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.endDate).toBe('2025-12-31');
    });

    it.each(['31/12/2025', 'not-a-date', 123])(
      'should reject invalid endDate (%s)',
      async(value: any) => {
        // Arrange
        const data = { ...makeValidQueryDto(), endDate: value };

        // Act / Assert
        expect.assertions(1);
        await target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(
            'endDate deve ser uma data válida no formato ISO 8601',
          );
        });
      },
    );
  });

  describe('pagination fields (from Queries)', () => {
    it('should accept page and size', async() => {
      // Arrange
      const data = makeValidQueryDto({ page: 2, size: 20 });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.page).toBe(2);
      expect(result.size).toBe(20);
    });

    it('should transform string page and size to number', async() => {
      // Arrange
      const data = { ...makeValidQueryDto(), page: '2' as any, size: '20' as any };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.page).toBe(2);
      expect(result.size).toBe(20);
    });
  });

  describe('search field (from Queries)', () => {
    it('should trim search', async() => {
      // Arrange
      const data = makeValidQueryDto({ search: '  /admin/client  ' });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.search).toBe('/admin/client');
    });
  });
});
