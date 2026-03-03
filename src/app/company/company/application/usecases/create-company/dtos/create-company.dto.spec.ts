import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateCompanyInputDto } from './create-company.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateCompanyInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

function makeValidInputDto(overrides: Partial<CreateCompanyInputDto> = {}): CreateCompanyInputDto {
  return {
    name: 'Empresa LTDA',
    fantasyName: 'Empresa',
    document: '09.748.165/0001-10',
    ie: null,
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    phone01: '1133334444',
    phone02: null,
    cellphone: null,
    email01: 'contato@empresa.com',
    email02: null,
    ...overrides,
  };
}

describe('CreateCompanyInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('name field', () => {
    it.each([undefined, null, '', '  '])('should throw if name is empty (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ name: value as string });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'name');
      });
    });

    it('should trim name', async() => {
      const data = makeValidInputDto({ name: '  Empresa LTDA  ' });

      const result = await target.transform(data, metadata);

      expect(result.name).toBe('Empresa LTDA');
    });
  });

  describe('document field', () => {
    it.each([undefined, null, '', '  '])(
      'should throw if document is empty (%s)',
      async(value: unknown) => {
        const data = makeValidInputDto({ document: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('document é obrigatório');
        });
      },
    );

    it('should trim document', async() => {
      const data = makeValidInputDto({ document: '  09.748.165/0001-10  ' });

      const result = await target.transform(data, metadata);

      expect(result.document).toBe('09.748.165/0001-10');
    });
  });

  describe('email01 field', () => {
    it.each([undefined, null, '', '  '])(
      'should throw if email01 is empty (%s)',
      async(value: unknown) => {
        const data = makeValidInputDto({ email01: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'email01');
        });
      },
    );

    it('should throw if email01 is invalid', async() => {
      const data = makeValidInputDto({ email01: 'invalid-email' });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'e-mail');
      });
    });

    it('should accept valid email', async() => {
      const data = makeValidInputDto({ email01: 'contato@empresa.com' });

      const result = await target.transform(data, metadata);

      expect(result.email01).toBe('contato@empresa.com');
    });
  });

  describe('all fields validation', () => {
    it('should pass if all fields are valid', async() => {
      const data = makeValidInputDto();

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(CreateCompanyInputDto);
      expect(result.name).toBe('Empresa LTDA');
      expect(result.fantasyName).toBe('Empresa');
      expect(result.document).toBe('09.748.165/0001-10');
      expect(result.ie).toBeNull();
      expect(result.zipCode).toBe('01310100');
      expect(result.street).toBe('Av Paulista');
      expect(result.number).toBe('1000');
      expect(result.city).toBe('São Paulo');
      expect(result.state).toBe('SP');
      expect(result.email01).toBe('contato@empresa.com');
    });

    it('should pass with all optional fields filled', async() => {
      const data = makeValidInputDto({
        ie: '123456789',
        complement: 'Sala 1',
        phone02: '1144445555',
        cellphone: '11999998888',
        email02: 'vendas@empresa.com',
      });

      const result = await target.transform(data, metadata);

      expect(result.ie).toBe('123456789');
      expect(result.complement).toBe('Sala 1');
      expect(result.phone02).toBe('1144445555');
      expect(result.cellphone).toBe('11999998888');
      expect(result.email02).toBe('vendas@empresa.com');
    });
  });
});
