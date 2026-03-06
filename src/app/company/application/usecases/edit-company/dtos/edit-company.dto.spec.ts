import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditCompanyInputDto } from './edit-company.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditCompanyInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

describe('EditCompanyInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept empty object (all fields optional)', async() => {
    const result = await target.transform({}, metadata);

    expect(result).toBeInstanceOf(EditCompanyInputDto);
    expect(result).toEqual({});
  });

  it('should accept partial update with name', async() => {
    const result = await target.transform({ name: 'Nova Empresa' }, metadata);

    expect(result.name).toBe('Nova Empresa');
  });

  it('should throw when name is provided but empty', async() => {
    expect.assertions(1);
    return target.transform({ name: '' }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'name');
    });
  });

  it('should accept partial update with document', async() => {
    const result = await target.transform({ document: '09.748.165/0001-10' }, metadata);

    expect(result.document).toBe('09.748.165/0001-10');
  });

  it('should accept partial update with multiple fields', async() => {
    const data = {
      name: 'Empresa Atualizada',
      fantasyName: 'Nova Fantasia',
      city: 'Rio de Janeiro',
    };

    const result = await target.transform(data, metadata);

    expect(result.name).toBe('Empresa Atualizada');
    expect(result.fantasyName).toBe('Nova Fantasia');
    expect(result.city).toBe('Rio de Janeiro');
  });

  it('should trim string fields when provided', async() => {
    const result = await target.transform(
      {
        name: '  Empresa  ',
        city: '  SP  ',
      },
      metadata,
    );

    expect(result.name).toBe('Empresa');
    expect(result.city).toBe('SP');
  });
});
