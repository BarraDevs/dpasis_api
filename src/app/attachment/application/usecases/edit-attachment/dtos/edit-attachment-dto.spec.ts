import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { EditAttachmentInputDto } from './edit-attachment.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditAttachmentInputDto,
};

describe('EditAttachmentInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  // Only testing 'link' as ownerId is omitted
  describe('link field', () => {
    const field = 'link';
    const type = 'URL válida';

    it.each([undefined])(`should not throw error if ${field} is empty (%s)`, async(value: any) => {
      const data = { [field]: value };
      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(EditAttachmentInputDto);
      expect(result[field] === undefined || result[field] === null).toBe(true);
    });

    it(`should throw an error if ${field} is an empty string`, async() => {
      const data = { [field]: '' };
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        // IsUrl fails for empty string
        expect(error.getResponse().message).toContain(`${field} deve ser uma ${type}`);
      });
    });

    it.each([123, true, 'not-a-valid-url', 'htp://incomplete', {}])(`should throw an error if ${field} is not a valid URL (%s)`, async(value: any) => {
      const data = { [field]: value };
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser uma ${type}`);
      });
    });
  });

  it('should pass if link is valid', async() => {
    // Arrange
    const data: EditAttachmentInputDto = {
      link: 'https://new-example.com/another-file.zip',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditAttachmentInputDto);
    expect(result).toEqual(data);
  });

  it('should pass if body is empty (all fields optional in PartialType)', async() => {
    const data = {};
    const result = await target.transform(data, metadata);
    expect(result).toBeInstanceOf(EditAttachmentInputDto);
    expect(result).toEqual({});
  });

  it('should trim link field', async() => {
    const data = {
      link: '  https://example.com/padded-link.txt  ',
    };
    const result = await target.transform(data, metadata);
    expect(result.link).toBe('https://example.com/padded-link.txt');
  });
});
