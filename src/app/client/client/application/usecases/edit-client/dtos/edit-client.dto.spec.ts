import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditClientInputDto } from './edit-client.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditClientInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some(m => m.includes(substring))).toBe(true);
}

describe('EditClientInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept empty object (all fields optional)', async() => {
    const result = await target.transform({}, metadata);

    expect(result).toBeInstanceOf(EditClientInputDto);
    expect(result).toEqual({});
  });

  it('should accept partial update with companyName', async() => {
    const result = await target.transform({ companyName: 'Nova Empresa' }, metadata);

    expect(result.companyName).toBe('Nova Empresa');
  });

  it('should throw when companyName is provided but empty', async() => {
    expect.assertions(1);
    return target.transform({ companyName: '' }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'companyName');
    });
  });

  it('should accept partial update with document', async() => {
    const result = await target.transform({ document: '09.748.165/0001-10' }, metadata);

    expect(result.document).toBe('09.748.165/0001-10');
  });

  it('should accept partial update with type', async() => {
    const result = await target.transform({ type: ClientType.PF }, metadata);

    expect(result.type).toBe(ClientType.PF);
  });

  it('should throw when type is invalid', async() => {
    expect.assertions(1);
    return target.transform({ type: 'INVALID' }, metadata).catch((error) => {
      expect(error.getResponse().message).toContain('type inválido.');
    });
  });

  it('should accept partial update with multiple fields', async() => {
    const data = {
      companyName: 'Empresa Atualizada',
      headquarters: 'Rio de Janeiro',
      fantasyName: 'Fantasia',
    };

    const result = await target.transform(data, metadata);

    expect(result.companyName).toBe('Empresa Atualizada');
    expect(result.headquarters).toBe('Rio de Janeiro');
    expect(result.fantasyName).toBe('Fantasia');
  });

  it('should trim string fields when provided', async() => {
    const result = await target.transform({
      companyName: '  Empresa  ',
      headquarters: '  SP  ',
    }, metadata);

    expect(result.companyName).toBe('Empresa');
    expect(result.headquarters).toBe('SP');
  });

  it('should accept partial update with domain', async() => {
    const result = await target.transform({ domain: 'novo.domínio.br' }, metadata);

    expect(result.domain).toBe('novo.domínio.br');
  });

  it('should accept null domain to clear optional field', async() => {
    const result = await target.transform({ domain: null }, metadata);

    expect(result.domain).toBeNull();
  });

  it('should trim domain when provided', async() => {
    const result = await target.transform({ domain: '  app.io  ' }, metadata);

    expect(result.domain).toBe('app.io');
  });

  it('should reject domain longer than 128 characters', async() => {
    expect.assertions(1);
    return target.transform({ domain: 'z'.repeat(129) }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'domain');
    });
  });
});
