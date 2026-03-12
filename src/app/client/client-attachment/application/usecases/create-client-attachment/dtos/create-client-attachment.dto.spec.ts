import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateClientAttachmentInputDto, CreateClientAttachmentOutputDto } from './create-client-attachment.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateClientAttachmentInputDto,
};

function makeValidInputDto(
  overrides: Partial<CreateClientAttachmentInputDto> = {},
): CreateClientAttachmentInputDto {
  return {
    clientId: 1,
    description: 'Descrição do anexo',
    link: 'https://example.com/document.pdf',
    ...overrides,
  };
}

describe('CreateClientAttachmentInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('clientId field', () => {
    it.each([undefined, null, '', '  '])(
      'should throw an error if clientId is empty (%s)',
      async(value: any) => {
        const data = makeValidInputDto({ clientId: value as any });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('clientId é obrigatório');
        });
      },
    );

    it.each([1.5, 'abc', true, false, {}, []])(
      'should throw an error if clientId is not an integer (%s)',
      async(value: any) => {
        const data = makeValidInputDto({ clientId: value as any });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(
            'clientId deve ser um número inteiro',
          );
        });
      },
    );

    it('should accept valid clientId', async() => {
      const data = makeValidInputDto({ clientId: 42 });

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(42);
    });

    it('should transform string number to number', async() => {
      const data = { ...makeValidInputDto(), clientId: '99' as any };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(99);
    });

    it('should trim whitespace from clientId', async() => {
      const data = { ...makeValidInputDto(), clientId: '  1  ' as any };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(1);
    });
  });

  describe('description field', () => {
    it.each([undefined, null, '', '  '])(
      'should throw an error if description is empty (%s)',
      async(value: any) => {
        const data = makeValidInputDto({ description: value });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(
            'description é obrigatório',
          );
        });
      },
    );

    it.each([123, true, false, {}, []])(
      'should throw an error if description is not a string (%s)',
      async(value: any) => {
        const data = makeValidInputDto({ description: value as any });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(
            'description deve ser uma string',
          );
        });
      },
    );

    it('should throw an error if description exceeds 8192 characters', async() => {
      const data = makeValidInputDto({ description: 'a'.repeat(8193) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(
          'description deve ter no máximo 8192 caracteres',
        );
      });
    });

    it('should trim whitespace from description', async() => {
      const data = makeValidInputDto({ description: '  Descrição válida  ' });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Descrição válida');
    });

    it('should accept valid description', async() => {
      const data = makeValidInputDto({
        description: 'Contrato de prestação de serviços',
      });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Contrato de prestação de serviços');
    });

    it('should accept boundary value (8192 chars)', async() => {
      const description = 'a'.repeat(8192);
      const data = makeValidInputDto({ description });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe(description);
    });
  });

  describe('link field', () => {
    it.each([undefined, null, '', '  '])(
      'should throw an error if link is empty (%s)',
      async(value: any) => {
        const data = makeValidInputDto({ link: value });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('link é obrigatório');
        });
      },
    );

    it.each([123, true, false, {}, []])(
      'should throw an error if link is not a string (%s)',
      async(value: any) => {
        const data = makeValidInputDto({ link: value as any });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(
            'link deve ser uma string',
          );
        });
      },
    );

    it('should throw an error if link exceeds 2048 characters', async() => {
      const data = makeValidInputDto({ link: 'https://a.com/' + 'a'.repeat(2040) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(
          'link deve ter no máximo 2048 caracteres',
        );
      });
    });

    it('should trim whitespace from link', async() => {
      const data = makeValidInputDto({
        link: '  https://example.com/doc.pdf  ',
      });

      const result = await target.transform(data, metadata);

      expect(result.link).toBe('https://example.com/doc.pdf');
    });

    it('should accept valid url', async() => {
      const data = makeValidInputDto({
        link: 'https://storage.example.com/files/abc123.pdf',
      });

      const result = await target.transform(data, metadata);

      expect(result.link).toBe('https://storage.example.com/files/abc123.pdf');
    });

    it('should accept boundary value (2048 chars)', async() => {
      const link = 'https://' + 'a'.repeat(2038);
      const data = makeValidInputDto({ link });

      const result = await target.transform(data, metadata);

      expect(result.link).toBe(link);
    });
  });

  describe('all fields validation', () => {
    it('should pass if all fields are valid', async() => {
      const data = makeValidInputDto({
        clientId: 1,
        description: 'Descrição do anexo',
        link: 'https://example.com/document.pdf',
      });

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(CreateClientAttachmentInputDto);
      expect(result.clientId).toBe(1);
      expect(result.description).toBe('Descrição do anexo');
      expect(result.link).toBe('https://example.com/document.pdf');
    });

    it('should fail when multiple fields are invalid', async() => {
      const data = makeValidInputDto({
        clientId: undefined as any,
        description: '',
        link: '',
      });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const messages = error.getResponse().message;
        expect(Array.isArray(messages) ? messages.length : 1).toBeGreaterThan(0);
      });
    });
  });
});

describe('CreateClientAttachmentOutputDto', () => {
  it('should have id property', () => {
    const output: CreateClientAttachmentOutputDto = { id: 1 };
    expect(output.id).toBe(1);
  });
});
