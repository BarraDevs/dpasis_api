import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditClientDriveTypeInputDto } from './edit-client-drive-type.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditClientDriveTypeInputDto,
};

function makeValidInputDto(overrides: Partial<EditClientDriveTypeInputDto> = {}): EditClientDriveTypeInputDto {
  return {
    name: 'Google Drive',
    ...overrides,
  };
}

describe('EditClientDriveTypeInputDto', () => {
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
      const data = makeValidInputDto({ name: value });
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('name é obrigatório');
      });
    });

    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if name is not a string (%s)', async(value: any) => {
      const data = makeValidInputDto({ name: value });
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('name deve ser uma string');
      });
    });

    it('should throw an error if name exceeds 255 characters', async() => {
      const data = makeValidInputDto({ name: 'a'.repeat(256) });
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('name deve ter no máximo 255 caracteres');
      });
    });

    it('should trim whitespace from name', async() => {
      const data = makeValidInputDto({ name: '  Google Drive  ' });
      const result = await target.transform(data, metadata);
      expect(result.name).toBe('Google Drive');
    });

    it('should accept valid name', async() => {
      const data = makeValidInputDto({ name: 'OneDrive' });
      const result = await target.transform(data, metadata);
      expect(result.name).toBe('OneDrive');
    });
  });

  describe('all fields validation', () => {
    it('should pass if all fields are valid', async() => {
      const data = makeValidInputDto({ name: 'Google Drive' });
      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(EditClientDriveTypeInputDto);
      expect(result.name).toBe('Google Drive');
    });

    it('should accept boundary values for name (255 chars)', async() => {
      const name = 'a'.repeat(255);
      const data = makeValidInputDto({ name });
      const result = await target.transform(data, metadata);
      expect(result.name).toBe(name);
    });
  });
});
