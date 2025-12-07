import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
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

  describe('name field (optional)', () => {
    it('should allow undefined name (field is optional)', async() => {
      // Arrange
      const data = {
        link: 'https://example.com/file.pdf',
        ownerId: 'valid-owner-id',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.name).toBeUndefined();
      expect(result.link).toBe(data.link);
      expect(result.ownerId).toBe(data.ownerId);
    });

    it.each([
      '',
      '   ',
    ])('should allow empty string for optional name field (%s)', async(value: any) => {
      // Arrange
      const data = {
        name: value,
        link: 'https://example.com/file.pdf',
        ownerId: 'valid-owner-id',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      // Since name is optional with @IsOptional(), empty strings should be allowed
      // The @Trim() decorator will convert '   ' to ''
      expect(result.name).toBe('');
      expect(result.link).toBe(data.link);
      expect(result.ownerId).toBe(data.ownerId);
    });

    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if name is not a string (%s)', async(value: any) => {
      // Arrange
      const data = {
        name: value,
        link: 'https://example.com/file.pdf',
        ownerId: 'valid-owner-id',
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('name deve ser um texto');
      });
    });

    it('should trim whitespace from name when provided', async() => {
      // Arrange
      const data = {
        name: '  document.pdf  ',
        link: 'https://example.com/file.pdf',
        ownerId: 'valid-owner-id',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.name).toBe('document.pdf');
    });

    it('should accept valid name when provided', async() => {
      // Arrange
      const data = {
        name: 'my-important-document.pdf',
        link: 'https://example.com/file.pdf',
        ownerId: 'valid-owner-id',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.name).toBe(data.name);
    });
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


  it('should pass if all required fields are valid (without name)', async() => {
    // Arrange
    const data = {
      link: 'https://example.com/file.png',
      ownerId: 'owner-uuid-123',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateAttachmentInputDto);
    expect(result.name).toBeUndefined();
    expect(result.link).toBe(data.link);
    expect(result.ownerId).toBe(data.ownerId);
  });

  it('should pass if all fields are valid (including name)', async() => {
    // Arrange
    const data: CreateAttachmentInputDto = {
      name: 'important-document.pdf',
      link: 'https://example.com/file.png',
      ownerId: 'owner-uuid-123',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateAttachmentInputDto);
    expect(result).toEqual(data);
  });

  it('should trim all string fields', async() => {
    const data = {
      name: '  trimmed-name.doc  ',
      link: '  https://example.com/trimmed-link.jpg  ',
      ownerId: '  owner-trimmed-id  ',
    };
    const expected = {
      name: 'trimmed-name.doc',
      link: 'https://example.com/trimmed-link.jpg',
      ownerId: 'owner-trimmed-id',
    };

    const result = await target.transform(data, metadata);
    expect(result).toEqual(expected);
  });

  it('should trim only provided fields', async() => {
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
    expect(result.name).toBeUndefined();
  });

  it('should handle various file extensions in name', async() => {
    const testCases = [
      'document.pdf',
      'image.jpg',
      'spreadsheet.xlsx',
      'presentation.pptx',
      'archive.zip',
      'file-with-dashes.txt',
      'file_with_underscores.docx',
      'file with spaces.png',
      'file.with.dots.csv',
    ];

    for (const name of testCases) {
      const data = {
        name,
        link: 'https://example.com/file.pdf',
        ownerId: 'valid-owner-id',
      };

      const result = await target.transform(data, metadata);
      expect(result.name).toBe(name);
    }
  });

  it('should handle special characters in name', async() => {
    const data = {
      name: 'arquivo-com-acentos-ãçñü.pdf',
      link: 'https://example.com/file.pdf',
      ownerId: 'valid-owner-id',
    };

    const result = await target.transform(data, metadata);
    expect(result.name).toBe(data.name);
  });
});
