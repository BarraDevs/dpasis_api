import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { CreateAttachmentInputDto } from './create-attachment.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateAttachmentInputDto,
};

describe('CreateAttachmentInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each([
    { field: 'link', type: 'URL válida', maxLength: undefined }, // IsUrl checks length implicitly sometimes, MaxLength not used here
    { field: 'ownerId', type: 'string', maxLength: 256 },
  ])('$field field', ({ field, type, maxLength }) => {
    it.each([undefined, null, '', '  '])(`should throw an error if ${field} is empty (%s)`, async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} é obrigatório`);
      });
    });

    if (type === 'URL válida') {
      it.each([123, true, 'not-a-valid-url', 'htp://incomplete', {}])(`should throw an error if ${field} is not a valid URL (%s)`, async(value: any) => {
        const data = { [field]: value };
        expect.assertions(1);
        await target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(`${field} deve ser uma ${type}`);
        });
      });
    } else { // type === 'string'
      it.each([123, true, false, {}, []])(`should throw an error if ${field} is not a string (%s)`, async(value: any) => {
        const data = { [field]: value };
        expect.assertions(1);
        await target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(`${field} deve ser uma ${type}`);
        });
      });
      if (maxLength) {
        it(`should throw an error if ${field} exceeds maximum length (${maxLength})`, async() => {
          // Arrange
          const longString = 'a'.repeat(maxLength + 1);
          const data = { [field]: longString };

          // Act & Assert
          expect.assertions(1);
          await target.transform(data, metadata).catch((error) => {
            expect(error.getResponse().message).toContain(`${field} deve ter no máximo ${maxLength} caracteres`);
          });
        });
      }
    }
  });


  it('should pass if all fields are valid', async() => {
    // Arrange
    const data: CreateAttachmentInputDto = {
      link: 'https://example.com/file.png',
      ownerId: 'owner-uuid-123',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateAttachmentInputDto);
    expect(result).toEqual(data);
  });

  it('should trim string fields', async() => {
    const data = {
      link: '  https://example.com/trimmed-link.jpg  ',
      ownerId: '  owner-trimmed-id  ',
    };
    const expected = {
      link: 'https://example.com/trimmed-link.jpg',
      ownerId: 'owner-trimmed-id',
    };

    const result = await target.transform(data, metadata);
    expect(result).toEqual(expected);
  });
});
