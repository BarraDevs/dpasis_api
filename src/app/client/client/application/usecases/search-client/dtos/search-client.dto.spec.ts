import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { SearchClientInputDto } from './search-client.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: SearchClientInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some(m => m.includes(substring))).toBe(true);
}

function makeValidSearchClientInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    page: 1,
    size: 10,
    ...overrides,
  };
}

function makeFullFilter(): Record<string, unknown> {
  return {
    id: { eq: 1 },
    type: { eq: 'PJ' },
    parentClientId: { eq: 2 },
    isSubClient: { eq: false },
    document: { contains: '09.748.165' },
    ie: { eq: '123' },
    groupId: { in: [1, 2] },
    resaleId: { eq: 3 },
    companyId: { eq: 4 },
    attendanceId: { eq: 5 },
    maintenanceTicketId: { eq: 6 },
    companyName: { contains: 'Empresa' },
    fantasyName: { contains: 'Fantasia' },
    socialName: { contains: 'Social' },
    domain: { eq: 'exemplo.com' },
    headquarters: { eq: 'São Paulo' },
    invoiceType: { eq: 'CONTRACT' },
    generateInvoice: { eq: true },
    active: { eq: true },
    createdAt: { gte: '2026-01-01T00:00:00.000Z' },
    updatedAt: { lte: '2026-12-31T23:59:59.999Z' },
  };
}

describe('SearchClientInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });

  describe('happy path', () => {
    it('should accept empty body', async() => {
      // Arrange
      const data = {};

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(SearchClientInputDto);
      expect(result.filter).toBeUndefined();
      expect(result.page).toBeUndefined();
      expect(result.size).toBeUndefined();
    });

    it('should accept empty filter object', async() => {
      // Arrange
      const data = makeValidSearchClientInput({ filter: {} });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(SearchClientInputDto);
      expect(result.filter).toBeDefined();
      expect(result.filter).toEqual({});
    });

    it('should accept all filter fields', async() => {
      // Arrange
      const filter = makeFullFilter();
      const data = makeValidSearchClientInput({ filter });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(SearchClientInputDto);
      expect(result.filter).toMatchObject({
        id: { eq: 1 },
        type: { eq: 'PJ' },
        parentClientId: { eq: 2 },
        isSubClient: { eq: false },
        document: { contains: '09.748.165' },
        ie: { eq: '123' },
        groupId: { in: [1, 2] },
        resaleId: { eq: 3 },
        companyId: { eq: 4 },
        attendanceId: { eq: 5 },
        maintenanceTicketId: { eq: 6 },
        companyName: { contains: 'Empresa' },
        fantasyName: { contains: 'Fantasia' },
        socialName: { contains: 'Social' },
        domain: { eq: 'exemplo.com' },
        headquarters: { eq: 'São Paulo' },
        invoiceType: { eq: 'CONTRACT' },
        generateInvoice: { eq: true },
        active: { eq: true },
        createdAt: { gte: '2026-01-01T00:00:00.000Z' },
        updatedAt: { lte: '2026-12-31T23:59:59.999Z' },
      });
    });

    it('should transform nested filter with groupId in', async() => {
      // Arrange
      const data = { page: '1', size: '10', filter: { groupId: { in: [1, 2] } } };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(SearchClientInputDto);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
      expect(result.filter?.groupId?.in).toEqual([1, 2]);
    });

    it('should trim nested string filter contains', async() => {
      // Arrange
      const data = makeValidSearchClientInput({
        filter: { companyName: { contains: '  Empresa  ' } },
      });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.filter?.companyName?.contains).toBe('Empresa');
    });

    it('should coerce nested boolean filter from string', async() => {
      // Arrange
      const data = makeValidSearchClientInput({
        filter: { active: { eq: 'true' }, generateInvoice: { eq: 'false' } },
      });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.filter?.active?.eq).toBe(true);
      expect(result.filter?.generateInvoice?.eq).toBe(false);
    });

    it('should accept nested date filter ISO range', async() => {
      // Arrange
      const data = makeValidSearchClientInput({
        filter: {
          createdAt: { gte: '2026-01-01T00:00:00.000Z' },
          updatedAt: { lte: '2026-12-31T23:59:59.999Z' },
        },
      });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.filter?.createdAt?.gte).toBe('2026-01-01T00:00:00.000Z');
      expect(result.filter?.updatedAt?.lte).toBe('2026-12-31T23:59:59.999Z');
    });

    it('should accept accented companyName contains', async() => {
      // Arrange
      const data = makeValidSearchClientInput({
        filter: { companyName: { contains: 'João' } },
      });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.filter?.companyName?.contains).toBe('João');
    });

    it('should coerce nested int filter eq from numeric string', async() => {
      // Arrange
      const data = makeValidSearchClientInput({
        filter: { companyId: { eq: '4' } },
      });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.filter?.companyId?.eq).toBe(4);
    });
  });

  describe('page / size', () => {
    it('should coerce page and size from numeric strings', async() => {
      // Arrange
      const data = makeValidSearchClientInput({ page: '2', size: '25' });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.page).toBe(2);
      expect(result.size).toBe(25);
    });

    it('should reject non-positive page', async() => {
      // Arrange
      const data = makeValidSearchClientInput({ page: 0 });

      // Act / Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'page deve ser um número positivo');
      });
    });

    it('should reject non-positive size', async() => {
      // Arrange
      const data = makeValidSearchClientInput({ size: -1 });

      // Act / Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'size deve ser um número positivo');
      });
    });
  });

  describe('filter', () => {
    it('should accept null filter (optional)', async() => {
      // Arrange
      const data = makeValidSearchClientInput({ filter: null });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.filter).toBeNull();
    });

    it.each(['invalid', [1, 2]])('should reject filter that is not an object (%s)', async(value: unknown) => {
      const data = makeValidSearchClientInput({ filter: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'filter');
      });
    });

    it('should reject nested int filter with non-integer eq', async() => {
      // Arrange
      const data = makeValidSearchClientInput({
        filter: { companyId: { eq: 'abc' } },
      });

      // Act / Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'eq deve ser um número inteiro');
      });
    });

    it('should reject nested int filter in with non-integer item', async() => {
      // Arrange
      const data = makeValidSearchClientInput({
        filter: { groupId: { in: [1, 'x'] } },
      });

      // Act / Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'cada item de in deve ser um número inteiro');
      });
    });

    it('should reject nested string filter with non-string eq', async() => {
      // Arrange
      const data = makeValidSearchClientInput({
        filter: { companyName: { eq: 123 } },
      });

      // Act / Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'eq deve ser um texto');
      });
    });

    it('should reject nested boolean filter with non-boolean eq', async() => {
      // Arrange
      const data = makeValidSearchClientInput({
        filter: { active: { eq: 'yes' } },
      });

      // Act / Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'eq deve ser um booleano');
      });
    });

    it('should reject nested date filter with non-ISO value', async() => {
      // Arrange
      const data = makeValidSearchClientInput({
        filter: { createdAt: { eq: 'not-a-date' } },
      });

      // Act / Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'eq deve estar no formato ISO 8601');
      });
    });
  });

  describe('whitelist', () => {
    it('should strip unknown filter property', async() => {
      // Arrange
      const data = { filter: { unknownField: { eq: 1 }, groupId: { eq: 1 } } };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.filter).toBeDefined();
      expect('unknownField' in (result.filter as object)).toBe(false);
      expect(result.filter?.groupId?.eq).toBe(1);
    });

    it('should strip unknown top-level property', async() => {
      // Arrange
      const data = makeValidSearchClientInput({ extra: 'nope', filter: { id: { eq: 1 } } });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect('extra' in result).toBe(false);
      expect(result.filter?.id?.eq).toBe(1);
    });

    it('should strip unknown nested operator on int filter', async() => {
      // Arrange
      const data = makeValidSearchClientInput({
        filter: { companyId: { eq: 4, unknownOp: 9 } },
      });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.filter?.companyId?.eq).toBe(4);
      expect('unknownOp' in (result.filter?.companyId as object)).toBe(false);
    });
  });
});
