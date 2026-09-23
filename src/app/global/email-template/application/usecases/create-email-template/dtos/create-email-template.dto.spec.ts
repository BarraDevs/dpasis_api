import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateEmailTemplateInputDto } from './create-email-template.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateEmailTemplateInputDto,
};

function makeValidInputDto(overrides: Partial<CreateEmailTemplateInputDto> = {}): CreateEmailTemplateInputDto {
  return {
    name: 'Cobranca NFS-e',
    description: 'E-mail com dados da NFS-e.',
    subject: 'Sua NFS-e {{nfse.numero}} foi emitida',
    html: '<p>Olá {{cliente.nome}}</p>',
    ...overrides,
  };
}

describe('CreateEmailTemplateInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('name field', () => {
    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if name is empty (%s)', async(value: any) => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ name: value }), metadata).catch((error) => {
        expect(error.getResponse().message).toContain('name é obrigatório');
      });
    });

    it('should throw an error if name exceeds 255 characters', async() => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ name: 'a'.repeat(256) }), metadata).catch((error) => {
        expect(error.getResponse().message).toContain('name deve ter no máximo 255 caracteres');
      });
    });

    it('should trim whitespace from name', async() => {
      const result = await target.transform(makeValidInputDto({ name: '  Cobranca  ' }), metadata);

      expect(result.name).toBe('Cobranca');
    });
  });

  describe('subject and html', () => {
    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if subject is empty (%s)', async(value: any) => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ subject: value }), metadata).catch((error) => {
        expect(error.getResponse().message).toContain('subject é obrigatório');
      });
    });

    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if html is empty (%s)', async(value: any) => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ html: value }), metadata).catch((error) => {
        expect(error.getResponse().message).toContain('html é obrigatório');
      });
    });
  });

  describe('description field', () => {
    it('should accept omitted description', async() => {
      const data = makeValidInputDto();
      delete data.description;
      const result = await target.transform(data, metadata);

      expect(result.description).toBeUndefined();
    });

    it('should accept null description', async() => {
      const result = await target.transform(makeValidInputDto({ description: null }), metadata);

      expect(result.description).toBeNull();
    });
  });

  it('should pass if all fields are valid', async() => {
    const result = await target.transform(makeValidInputDto(), metadata);

    expect(result).toBeInstanceOf(CreateEmailTemplateInputDto);
    expect(result.name).toBe('Cobranca NFS-e');
  });
});
