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

    it('should accept boundary value (8192 chars)', async() => {
      const description = 'a'.repeat(8192);
      const data = makeValidInputDto({ description });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe(description);
    });
  });

  describe('clientId', () => {
    it('should strip clientId from payload (not part of edit DTO)', async() => {
      const data = {
        clientId: 99,
        description: 'Só descrição',
      };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(EditClientAttachmentInputDto);
      expect('clientId' in result).toBe(false);
      expect(result.description).toBe('Só descrição');
    });
  });

  describe('all fields validation', () => {
    it('should pass with empty object', async() => {
      const data = makeValidInputDto({});

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(EditClientAttachmentInputDto);
    });

    it('should pass with only description', async() => {
      const data = makeValidInputDto({ description: 'Apenas descrição' });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Apenas descrição');
    });
  });
});
