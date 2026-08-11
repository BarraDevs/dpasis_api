import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateCarrierInputDto } from './create-carrier.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateCarrierInputDto,
};

const REQUIRED_STRING_FIELDS = [
  'name',
  'fantasyName',
  'representative',
  'document',
  'contact',
  'zipCode',
  'street',
  'number',
  'neighborhood',
  'city',
  'state',
] as const;

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

function makeValidInputDto(overrides: Partial<CreateCarrierInputDto> = {}): CreateCarrierInputDto {
  return {
    name: 'Transportadora LTDA',
    fantasyName: 'Transportadora',
    representative: 'João Silva',
    document: '09.748.165/0001-10',
    contact: 'João Silva - (11) 99999-9999',
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    ...overrides,
  };
}

describe('CreateCarrierInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(REQUIRED_STRING_FIELDS)('%s field', (field) => {
    it.each([undefined, null, '', '  '])('should reject empty (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ [field]: value } as Partial<CreateCarrierInputDto>);

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, field);
      });
    });

    it('should trim whitespace', async() => {
      const data = makeValidInputDto({ [field]: `  value-${field}  ` } as Partial<CreateCarrierInputDto>);

      const result = await target.transform(data, metadata);

      expect(result[field]).toBe(`value-${field}`);
    });

    it.each([
      ['number', 123],
      ['boolean', true],
      ['object', {}],
      ['array', []],
    ] as const)('should reject %s', async(_label, value) => {
      const data = makeValidInputDto({ [field]: value } as any);

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, `${field} deve ser uma string`);
      });
    });
  });

  describe('complement field', () => {
    it('should accept null', async() => {
      const result = await target.transform(makeValidInputDto({ complement: null }), metadata);
      expect(result.complement).toBeNull();
    });

    it('should accept omitted complement', async() => {
      const data = makeValidInputDto();
      delete (data as { complement?: string | null }).complement;
      const result = await target.transform(data, metadata);
      expect(result.complement).toBeUndefined();
    });

    it('should trim complement when provided', async() => {
      const result = await target.transform(makeValidInputDto({ complement: '  Sala 1  ' }), metadata);
      expect(result.complement).toBe('Sala 1');
    });

    it.each([
      ['number', 1],
      ['boolean', false],
      ['object', {}],
      ['array', []],
    ] as const)('should reject %s', async(_label, value) => {
      const data = makeValidInputDto({ complement: value as any });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'complement deve ser uma string');
      });
    });
  });

  it('should accept valid input', async() => {
    const data = makeValidInputDto();

    const result = await target.transform(data, metadata);

    expect(result).toEqual(data);
  });

  it('should accept valid input with complement filled', async() => {
    const data = makeValidInputDto({ complement: 'Sala 1' });

    const result = await target.transform(data, metadata);

    expect(result.complement).toBe('Sala 1');
  });
});
