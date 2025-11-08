import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { EditAttachmentInputDto } from './edit-attachment.dto';

const editAttachmentInputMetadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditAttachmentInputDto,
};

describe('EditAttachmentDto', () => {
  describe('EditAttachmentInputDto', () => {
    let target: ValidationPipe;

    beforeEach(() => {
      target = new ValidationPipe(pipeOptions);
    });

    describe('name field (optional)', () => {
      it('should allow undefined name (field is optional)', async() => {
        // Arrange
        const data = {
          link: 'https://example.com/updated-file.pdf',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result.name).toBeUndefined();
        expect(result.link).toBe(data.link);
      });

      it('should allow empty string for optional name field', async() => {
        // Arrange
        const data = {
          name: '',
          link: 'https://example.com/file.pdf',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result.name).toBe('');
        expect(result.link).toBe(data.link);
      });

      it('should allow whitespace string for optional name field', async() => {
        // Arrange
        const data = {
          name: '   ',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result.name).toBe('');
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
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, editAttachmentInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('name deve ser um texto');
        });
      });

      it('should trim whitespace from name when provided', async() => {
        // Arrange
        const data = {
          name: '  updated-document.pdf  ',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result.name).toBe('updated-document.pdf');
      });

      it('should accept valid name when provided', async() => {
        // Arrange
        const data = {
          name: 'my-updated-document.pdf',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result.name).toBe('my-updated-document.pdf');
      });
    });

    describe('link field (optional)', () => {
      it('should allow undefined link (field is optional)', async() => {
        // Arrange
        const data = {
          name: 'Updated Document',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result.link).toBeUndefined();
        expect(result.name).toBe(data.name);
      });

      it.each([
        '',
        '   ',
      ])('should throw an error if link is provided but empty (%s)', async(value: any) => {
        // Arrange
        const data = {
          link: value,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, editAttachmentInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('link é obrigatório');
        });
      });

      it.each([
        123,
        true,
        'not-a-valid-url',
        'htp://incomplete',
        'invalid-protocol://example.com',
      ])('should throw an error if link is not a valid URL (%s)', async(value: any) => {
        // Arrange
        const data = {
          link: value,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, editAttachmentInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('link deve ser uma URL válida');
        });
      });

      it('should trim whitespace from link when provided', async() => {
        // Arrange
        const data = {
          link: '  https://example.com/updated-file.pdf  ',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result.link).toBe('https://example.com/updated-file.pdf');
      });

      it('should accept valid URLs when provided', async() => {
        const validUrls = [
          'https://example.com/file.pdf',
          'http://example.com/document.docx',
          'https://subdomain.example.com/path/to/file.jpg',
          'https://example.com/file-with-dashes.png',
          'https://example.com/file_with_underscores.zip',
          'https://example.com/path/file.extension?param=value',
          'https://example.com/path/file.extension#anchor',
        ];

        for (const url of validUrls) {
          const data = { link: url };
          const result = await target.transform(data, editAttachmentInputMetadata);
          expect(result.link).toBe(url);
        }
      });
    });

    describe('ownerId field (should not be present)', () => {
      it('should not include ownerId in the DTO (omitted field)', async() => {
        // Arrange
        const data = {
          name: 'Test Document',
          link: 'https://example.com/file.pdf',
          // ownerId should not be allowed in edit operations
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result).not.toHaveProperty('ownerId');
        expect(result.name).toBe(data.name);
        expect(result.link).toBe(data.link);
      });

      it('should ignore ownerId if provided (omitted field)', async() => {
        // Arrange
        const data = {
          name: 'Test Document',
          link: 'https://example.com/file.pdf',
          ownerId: 'this-should-be-ignored', // This field is omitted from EditAttachmentInputDto
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result).not.toHaveProperty('ownerId');
        expect(result.name).toBe(data.name);
        expect(result.link).toBe(data.link);
      });
    });

    describe('Partial updates', () => {
      it('should allow empty object (all fields optional)', async() => {
        // Arrange
        const data = {};

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result).toBeInstanceOf(EditAttachmentInputDto);
        expect(result.name).toBeUndefined();
        expect(result.link).toBeUndefined();
        expect(result).not.toHaveProperty('ownerId');
      });

      it('should allow partial update with only name', async() => {
        // Arrange
        const data = {
          name: 'Only Name Updated',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result).toBeInstanceOf(EditAttachmentInputDto);
        expect(result.name).toBe(data.name);
        expect(result.link).toBeUndefined();
      });

      it('should allow partial update with only link', async() => {
        // Arrange
        const data = {
          link: 'https://example.com/updated-link.pdf',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result).toBeInstanceOf(EditAttachmentInputDto);
        expect(result.name).toBeUndefined();
        expect(result.link).toBe(data.link);
      });

      it('should allow partial update with both fields', async() => {
        // Arrange
        const data = {
          name: 'Updated Document Name',
          link: 'https://example.com/updated-document.pdf',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result).toBeInstanceOf(EditAttachmentInputDto);
        expect(result.name).toBe(data.name);
        expect(result.link).toBe(data.link);
      });
    });

    describe('String transformations', () => {
      it('should trim whitespace from all provided string fields', async() => {
        // Arrange
        const data = {
          name: '  Trimmed Name  ',
          link: '  https://example.com/trimmed-link.pdf  ',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result.name).toBe('Trimmed Name');
        expect(result.link).toBe('https://example.com/trimmed-link.pdf');
      });

      it('should handle special characters in name', async() => {
        // Arrange
        const data = {
          name: 'arquivo-com-acentos-ãçñü-updated.pdf',
          link: 'https://example.com/special-chars.pdf',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result.name).toBe('arquivo-com-acentos-ãçñü-updated.pdf');
        expect(result.link).toBe('https://example.com/special-chars.pdf');
      });

      it('should handle various file extensions in name', async() => {
        const testCases = [
          'updated-document.pdf',
          'new-image.jpg',
          'revised-spreadsheet.xlsx',
          'updated-presentation.pptx',
          'new-archive.zip',
          'file-with-dashes-updated.txt',
          'file_with_underscores_new.docx',
          'file with spaces updated.png',
          'file.with.dots.updated.csv',
        ];

        for (const name of testCases) {
          const data = {
            name,
            link: 'https://example.com/file.pdf',
          };

          const result = await target.transform(data, editAttachmentInputMetadata);
          expect(result.name).toBe(name);
        }
      });
    });

    describe('URL validation edge cases', () => {
      it('should accept HTTPS URLs with different TLDs', async() => {
        const validUrls = [
          'https://example.com/file.pdf',
          'https://example.org/file.pdf',
          'https://example.net/file.pdf',
          'https://example.co.uk/file.pdf',
          'https://example.com.br/file.pdf',
        ];

        for (const url of validUrls) {
          const data = { link: url };
          const result = await target.transform(data, editAttachmentInputMetadata);
          expect(result.link).toBe(url);
        }
      });

      it('should accept HTTP URLs (not just HTTPS)', async() => {
        // Arrange
        const data = {
          link: 'http://example.com/file.pdf',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result.link).toBe('http://example.com/file.pdf');
      });

      it('should accept URLs with ports', async() => {
        // Arrange
        const data = {
          link: 'https://example.com:8080/file.pdf',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result.link).toBe('https://example.com:8080/file.pdf');
      });

      it('should accept URLs with query parameters', async() => {
        // Arrange
        const data = {
          link: 'https://example.com/file.pdf?version=2&download=true',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result.link).toBe('https://example.com/file.pdf?version=2&download=true');
      });

      it('should accept URLs with fragments', async() => {
        // Arrange
        const data = {
          link: 'https://example.com/file.pdf#section1',
        };

        // Act
        const result = await target.transform(data, editAttachmentInputMetadata);

        // Assert
        expect(result.link).toBe('https://example.com/file.pdf#section1');
      });
    });

    describe('Combined validation scenarios', () => {
      it('should pass validation with realistic update scenarios', async() => {
        const scenarios = [
          {
            description: 'Update only filename',
            data: { name: 'new-filename.pdf' },
          },
          {
            description: 'Update only URL',
            data: { link: 'https://new-location.com/file.pdf' },
          },
          {
            description: 'Update both name and URL',
            data: {
              name: 'completely-new-file.docx',
              link: 'https://new-server.com/documents/file.docx',
            },
          },
          {
            description: 'Clear name but keep URL',
            data: {
              name: '',
              link: 'https://example.com/file.pdf',
            },
          },
        ];

        for (const scenario of scenarios) {
          const result = await target.transform(scenario.data, editAttachmentInputMetadata);
          expect(result).toBeInstanceOf(EditAttachmentInputDto);

          if (scenario.data.name !== undefined) {
            expect(result.name).toBe(scenario.data.name);
          }
          if (scenario.data.link !== undefined) {
            expect(result.link).toBe(scenario.data.link);
          }
        }
      });
    });
  });
});
