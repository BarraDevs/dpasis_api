import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditClientAttachmentInputDto } from './edit-client-attachment.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditClientAttachmentInputDto,
};

function makeValidInputDto(
  overrides: Partial<EditClientAttachmentInputDto> = {},
): EditClientAttachmentInputDto {
  return {
    ...overrides,
  };
}

describe('EditClientAttachmentInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('clientId field', () => {
    it.each([1.5, 'abc', true, false, {}, []])(
      'should throw an error if clientId is not an integer (%s)',
      async(value: any) => {
        const data = makeValidInputDto({ clientId: value });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(
            'clientId deve ser um número inteiro',
          );
        });
      },
    );

    it('should accept valid clientId', async() => {
      const data = makeValidInputDto({ clientId: 99 });

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(99);
    });

    it('should be optional', async() => {
      const data = makeValidInputDto({ clientId: undefined });

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBeUndefined();
    });
  });

  describe('description field', () => {
    it.each([123, true, false, {}, []])(
      'should throw an error if description is not a string (%s)',
      async(value: any) => {
        const data = makeValidInputDto({ description: value });

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

    it('should accept valid description', async() => {
      const data = makeValidInputDto({ description: 'Nova descrição' });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Nova descrição');
    });

    it('should trim whitespace from description', async() => {
      const data = makeValidInputDto({ description: '  Nova descrição  ' });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Nova descrição');
    });

    it('should be optional', async() => {
      const data = makeValidInputDto({ description: undefined });

      const result = await target.transform(data, metadata);

      expect(result.description).toBeUndefined();
    });
  });

  describe('link field', () => {
    it.each([123, true, false, {}, []])(
      'should throw an error if link is not a string (%s)',
      async(value: any) => {
        const data = makeValidInputDto({ link: value });

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

    it('should accept valid link', async() => {
      const data = makeValidInputDto({ link: 'https://updated.com/doc.pdf' });

      const result = await target.transform(data, metadata);

      expect(result.link).toBe('https://updated.com/doc.pdf');
    });

    it('should trim whitespace from link', async() => {
      const data = makeValidInputDto({ link: '  https://trimmed.com  ' });

      const result = await target.transform(data, metadata);

      expect(result.link).toBe('https://trimmed.com');
    });

    it('should be optional', async() => {
      const data = makeValidInputDto({ link: undefined });

      const result = await target.transform(data, metadata);

      expect(result.link).toBeUndefined();
    });
  });

  describe('all fields validation', () => {
    it('should pass with empty object', async() => {
      const data = makeValidInputDto({});

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(EditClientAttachmentInputDto);
    });

    it('should pass with only description', async() => {
      const data = makeValidInputDto({ description: 'Só descrição' });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Só descrição');
      expect(result.clientId).toBeUndefined();
      expect(result.link).toBeUndefined();
    });

    it('should pass with only link', async() => {
      const data = makeValidInputDto({ link: 'https://solo.com' });

      const result = await target.transform(data, metadata);

      expect(result.link).toBe('https://solo.com');
      expect(result.clientId).toBeUndefined();
      expect(result.description).toBeUndefined();
    });

    it('should pass with only clientId', async() => {
      const data = makeValidInputDto({ clientId: 5 });

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(5);
      expect(result.description).toBeUndefined();
      expect(result.link).toBeUndefined();
    });

    it('should pass with all fields', async() => {
      const data = makeValidInputDto({
        clientId: 10,
        description: 'Descrição atualizada',
        link: 'https://all.com/updated.pdf',
      });

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(10);
      expect(result.description).toBe('Descrição atualizada');
      expect(result.link).toBe('https://all.com/updated.pdf');
    });
  });
});
