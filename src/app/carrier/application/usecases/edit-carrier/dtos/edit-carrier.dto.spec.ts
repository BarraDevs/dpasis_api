import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditCarrierInputDto } from './edit-carrier.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditCarrierInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

describe('EditCarrierInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept empty body (all fields optional)', async() => {
    const result = await target.transform({}, metadata);

    expect(result).toBeInstanceOf(EditCarrierInputDto);
    expect(result).toEqual({});
  });

  it('should accept partial update with name', async() => {
    const result = await target.transform({ name: 'Nova Transportadora' }, metadata);

    expect(result.name).toBe('Nova Transportadora');
  });

  it('should accept partial update with multiple fields', async() => {
    const data = {
      name: 'Transportadora Atualizada',
      fantasyName: 'Nova Fantasia',
      city: 'Rio de Janeiro',
      document: '09.748.165/0001-10',
    };

    const result = await target.transform(data, metadata);

    expect(result.name).toBe('Transportadora Atualizada');
    expect(result.fantasyName).toBe('Nova Fantasia');
    expect(result.city).toBe('Rio de Janeiro');
    expect(result.document).toBe('09.748.165/0001-10');
  });

  it.each(['', '   '])('should reject name when provided but empty (%s)', async(value) => {
    expect.assertions(1);
    return target.transform({ name: value }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'name');
    });
  });

  it('should trim string fields when provided', async() => {
    const result = await target.transform(
      {
        name: '  Transportadora  ',
        city: '  SP  ',
        document: '  09.748.165/0001-10  ',
        street: '  Rua A  ',
      },
      metadata,
    );

    expect(result.name).toBe('Transportadora');
    expect(result.city).toBe('SP');
    expect(result.document).toBe('09.748.165/0001-10');
    expect(result.street).toBe('Rua A');
  });

  it.each([
    ['number', 123],
    ['boolean', true],
    ['object', {}],
    ['array', []],
  ] as const)('should reject name as %s', async(_label, value) => {
    expect.assertions(1);
    return target.transform({ name: value }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'name deve ser uma string');
    });
  });

  it('should accept complement null', async() => {
    const result = await target.transform({ complement: null }, metadata);

    expect(result.complement).toBeNull();
  });
});
