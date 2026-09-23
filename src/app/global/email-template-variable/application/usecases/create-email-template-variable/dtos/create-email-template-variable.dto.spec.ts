import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateEmailTemplateVariableInputDto } from './create-email-template-variable.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateEmailTemplateVariableInputDto,
};

function makeValidInputDto(overrides: Partial<CreateEmailTemplateVariableInputDto> = {}): CreateEmailTemplateVariableInputDto {
  return {
    key: 'nfse.numero',
    label: 'Número da NFS-e',
    example: '123',
    description: 'Número atribuído à nota.',
    ...overrides,
  };
}

describe('CreateEmailTemplateVariableInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('key field', () => {
    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if key is empty (%s)', async(value: any) => {
      const data = makeValidInputDto({ key: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('key é obrigatório');
      });
    });

    it.each([
      '1nfse',
      'nfse-numero',
      'nfse numero',
      '{{nfse}}',
    ])('should throw an error if key has invalid charset (%s)', async(value: string) => {
      const data = makeValidInputDto({ key: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message.join(' ')).toContain('key deve começar com letra');
      });
    });

    it('should throw an error if key exceeds 128 characters', async() => {
      const data = makeValidInputDto({ key: `a${'b'.repeat(128)}` });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('key deve ter no máximo 128 caracteres');
      });
    });

    it('should accept dotted key and trim whitespace', async() => {
      const result = await target.transform(makeValidInputDto({ key: '  cliente.nome  ' }), metadata);

      expect(result.key).toBe('cliente.nome');
    });
  });

  describe('label field', () => {
    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if label is empty (%s)', async(value: any) => {
      const data = makeValidInputDto({ label: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('label é obrigatório');
      });
    });

    it('should throw an error if label exceeds 255 characters', async() => {
      const data = makeValidInputDto({ label: 'a'.repeat(256) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('label deve ter no máximo 255 caracteres');
      });
    });
  });

  describe('optional fields', () => {
    it('should accept omitted example and description', async() => {
      const result = await target.transform({ key: 'nfse.numero', label: 'Número' }, metadata);

      expect(result.example).toBeUndefined();
      expect(result.description).toBeUndefined();
    });

    it('should accept null example and description', async() => {
      const result = await target.transform(makeValidInputDto({ example: null, description: null }), metadata);

      expect(result.example).toBeNull();
      expect(result.description).toBeNull();
    });
  });

  describe('all fields validation', () => {
    it('should pass if all fields are valid', async() => {
      const result = await target.transform(makeValidInputDto(), metadata);

      expect(result).toBeInstanceOf(CreateEmailTemplateVariableInputDto);
      expect(result.key).toBe('nfse.numero');
      expect(result.label).toBe('Número da NFS-e');
    });
  });
});
