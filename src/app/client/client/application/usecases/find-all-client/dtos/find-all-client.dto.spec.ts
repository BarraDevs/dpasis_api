import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllClientQueryDto } from './find-all-client.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllClientQueryDto,
};

const STRING_FILTER_FIELDS = [
  'companyName',
  'fantasyName',
  'socialName',
  'document',
  'headquarters',
  'domain',
  'ie',
] as const;

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

describe('FindAllClientQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should be defined', () => {
    expect(FindAllClientQueryDto).toBeDefined();
  });

  it('should pass when all fields are omitted', async() => {
    const data = {};

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(FindAllClientQueryDto);
    expect(result.companyName).toBeUndefined();
    expect(result.fantasyName).toBeUndefined();
    expect(result.socialName).toBeUndefined();
    expect(result.document).toBeUndefined();
    expect(result.headquarters).toBeUndefined();
    expect(result.domain).toBeUndefined();
    expect(result.ie).toBeUndefined();
    expect(result.page).toBeUndefined();
    expect(result.size).toBeUndefined();
    expect(result.active).toBeUndefined();
  });

  describe.each(STRING_FILTER_FIELDS)('%s', (field) => {
    it('should trim string values', async() => {
      const data = { [field]: '  valor  ' };

      const result = await target.transform(data, metadata);

      expect(result[field]).toBe('valor');
    });

    it('should accept empty string', async() => {
      const data = { [field]: '' };

      const result = await target.transform(data, metadata);

      expect(result[field]).toBe('');
    });

    it.each([
      ['number', 123],
      ['boolean', true],
      ['object', {}],
      ['array', []],
    ] as const)('should reject %s', async(_label, value) => {
      const data = { [field]: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, `${field} deve ser um texto`);
      });
    });
  });

  describe('domain', () => {
    it('should reject values longer than 128 characters', async() => {
      const data = { domain: 'a'.repeat(129) };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'domain deve ter no máximo 128 caracteres');
      });
    });

    it('should accept boundary length 128', async() => {
      const data = { domain: 'a'.repeat(128) };

      const result = await target.transform(data, metadata);

      expect(result.domain).toHaveLength(128);
    });
  });

  describe('page', () => {
    it('should accept when omitted', async() => {
      const result = await target.transform({}, metadata);
      expect(result.page).toBeUndefined();
    });

    it('should transform numeric string', async() => {
      const result = await target.transform({ page: '2' }, metadata);
      expect(result.page).toBe(2);
    });

    it('should accept integer number', async() => {
      const result = await target.transform({ page: 5 }, metadata);
      expect(result.page).toBe(5);
    });

    it.each([
      ['non-numeric string', 'abc'],
      ['zero', 0],
      ['negative', -1],
      ['float', 1.5],
      ['boolean', true],
      ['object', {}],
      ['array', []],
    ] as const)('should reject %s', async(_label, value) => {
      const data = { page: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'page');
      });
    });
  });

  describe('size', () => {
    it('should accept when omitted', async() => {
      const result = await target.transform({}, metadata);
      expect(result.size).toBeUndefined();
    });

    it('should transform numeric string', async() => {
      const result = await target.transform({ size: '15' }, metadata);
      expect(result.size).toBe(15);
    });

    it('should accept integer number', async() => {
      const result = await target.transform({ size: 20 }, metadata);
      expect(result.size).toBe(20);
    });

    it.each([
      ['non-numeric string', 'xyz'],
      ['zero', 0],
      ['negative', -3],
      ['float', 2.2],
      ['boolean', false],
      ['object', {}],
      ['array', []],
    ] as const)('should reject %s', async(_label, value) => {
      const data = { size: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'size');
      });
    });
  });

  describe('active', () => {
    it('should accept when omitted', async() => {
      const result = await target.transform({}, metadata);
      expect(result.active).toBeUndefined();
    });

    it.each([true, false] as const)('should accept boolean %s', async(value) => {
      const result = await target.transform({ active: value }, metadata);
      expect(result.active).toBe(value);
    });

    it.each([
      ['true', 'true', true],
      ['True', 'True', true],
      ['false', 'false', false],
      ['FALSE', 'FALSE', false],
    ] as const)('should coerce string %s', async(_label, raw, expected) => {
      const result = await target.transform({ active: raw }, metadata);
      expect(result.active).toBe(expected);
    });

    it.each([
      ['invalid string', 'yes'],
      ['number', 1],
      ['object', {}],
      ['array', []],
    ] as const)('should reject %s', async(_label, value) => {
      const data = { active: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'active deve ser um booleano');
      });
    });

    it('should reject padded string boolean', async() => {
      const data = { active: ' true ' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'active');
      });
    });
  });

  describe('search (excluded from DTO)', () => {
    it('should strip search from the transformed query', async() => {
      const data = { search: 'não deve aparecer', companyName: 'ACME' };

      const result = await target.transform(data, metadata);

      expect(result).not.toHaveProperty('search');
      expect(result.companyName).toBe('ACME');
    });
  });

  describe('combined valid payload', () => {
    it('should pass with all supported filters', async() => {
      const data = {
        companyName: ' Razão ',
        fantasyName: ' Fantasia ',
        page: '1',
        size: '10',
        active: 'false',
      };

      const result = await target.transform(data, metadata);

      expect(result.companyName).toBe('Razão');
      expect(result.fantasyName).toBe('Fantasia');
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
      expect(result.active).toBe(false);
    });
  });
});
