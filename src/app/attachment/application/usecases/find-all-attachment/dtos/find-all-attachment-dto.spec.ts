import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllAttachmentQueryDto } from './find-all-attachment.dto';

const metadata: ArgumentMetadata = {
  type: 'query', // Assuming it's used as query params
  metatype: FindAllAttachmentQueryDto,
};

describe('FindAllAttachmentQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  // Test own property 'ownerId'
  describe('ownerId field', () => {
    const field = 'ownerId';
    const type = 'string';
    const maxLength = 256;

    it.each([undefined, null, '', '  '])(`should throw an error if ${field} is empty (%s)`, async(value: any) => {
      const data = { [field]: value };
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} é obrigatório`);
      });
    });

    it.each([123, true, false, {}, []])(`should throw an error if ${field} is not a string (%s)`, async(value: any) => {
      const data = { [field]: value };
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser uma ${type}`);
      });
    });

    it(`should throw an error if ${field} exceeds maximum length (${maxLength})`, async() => {
      const longString = 'a'.repeat(maxLength + 1);
      const data = { [field]: longString };
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ter no máximo ${maxLength} caracteres`);
      });
    });
  });

  // Test inherited properties from Queries DTO
  describe.each(['page', 'size'])('%s field (inherited)', (field) => {
    // ... (tests for page and size as in find-all-license-dto.spec.ts) ...
    it.each([undefined, null])(`should not throw an error if ${field} is empty (%s)`, async(value: any) => {
      const data = { [field]: value, ownerId: 'test-owner' }; // ownerId is required
      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(FindAllAttachmentQueryDto);
    });
    // ... other inherited tests ...
  });

  describe('search field (inherited)', () => {
    // ... (tests for search as in find-all-license-dto.spec.ts) ...
    it.each([undefined, null, '', '  '])('should not throw an error if search is empty (%s)', async(value: any) => {
      const data = { search: value, ownerId: 'test-owner' }; // ownerId is required
      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(FindAllAttachmentQueryDto);
    });
    // ... other inherited tests ...
  });

  it('should pass if ownerId is valid and other fields are missing', async() => {
    const data = {
      ownerId: 'owner-123',
    };
    const result = await target.transform(data, metadata);
    expect(result).toBeInstanceOf(FindAllAttachmentQueryDto);
    expect(result).toEqual(data);
  });

  it('should pass if all fields are valid', async() => {
    const data = {
      ownerId: 'owner-456',
      page: '3',
      size: '15',
      search: ' report ',
    };
    const expected = {
      ownerId: 'owner-456',
      page: 3,
      size: 15,
      search: 'report',
    };

    const result = await target.transform(data, metadata);
    expect(result).toBeInstanceOf(FindAllAttachmentQueryDto);
    expect(result).toEqual(expected);
  });

  it('should trim ownerId and search fields', async() => {
    const data = {
      ownerId: '  spaced-owner-id  ',
      search: '  spaced search term  ',
    };
    const expected = {
      ownerId: 'spaced-owner-id',
      search: 'spaced search term',
    };
    const result = await target.transform(data, metadata);
    expect(result).toEqual(expected);
  });
});
