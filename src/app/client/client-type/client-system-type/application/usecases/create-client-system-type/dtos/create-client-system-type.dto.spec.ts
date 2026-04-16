import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateClientSystemTypeInputDto } from './create-client-system-type.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateClientSystemTypeInputDto,
};

function makeValidInputDto(overrides: Partial<CreateClientSystemTypeInputDto> = {}): CreateClientSystemTypeInputDto {
  return {
    name: 'Sistema ERP',
    ...overrides,
  };
}

describe('CreateClientSystemTypeInputDto', () => {
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
      const data = makeValidInputDto({ name: '  Sistema ERP  ' });
      const result = await target.transform(data, metadata);
      expect(result.name).toBe('Sistema ERP');
    });

    it('should accept valid name', async() => {
      const data = makeValidInputDto({ name: 'Sistema CRM' });
      const result = await target.transform(data, metadata);
      expect(result.name).toBe('Sistema CRM');
    });
  });

  describe('imageUrl field', () => {
    it('should allow imageUrl to be omitted', async() => {
      const data = makeValidInputDto({ name: 'Sistema ERP' });
      const result = await target.transform(data, metadata);
      expect(result.imageUrl).toBeUndefined();
    });

    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if imageUrl is not a string (%s)', async(value: any) => {
      const data = makeValidInputDto({ imageUrl: value });
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('imageUrl deve ser uma string');
      });
    });

    it('should throw an error if imageUrl exceeds 2048 characters', async() => {
      const data = makeValidInputDto({ imageUrl: 'a'.repeat(2049) });
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('imageUrl deve ter no máximo 2048 caracteres');
      });
    });

    it('should trim whitespace from imageUrl', async() => {
      const data = makeValidInputDto({ imageUrl: '  https://example.com/icon.png  ' });
      const result = await target.transform(data, metadata);
      expect(result.imageUrl).toBe('https://example.com/icon.png');
    });

    it('should accept valid imageUrl', async() => {
      const url = 'https://cdn.example.com/path/to/icon.webp';
      const data = makeValidInputDto({ imageUrl: url });
      const result = await target.transform(data, metadata);
      expect(result.imageUrl).toBe(url);
    });

    it('should accept boundary value for imageUrl (2048 chars)', async() => {
      const imageUrl = 'a'.repeat(2048);
      const data = makeValidInputDto({ imageUrl });
      const result = await target.transform(data, metadata);
      expect(result.imageUrl).toBe(imageUrl);
    });

    it('should accept empty string for imageUrl after trim', async() => {
      const data = makeValidInputDto({ imageUrl: '   ' });
      const result = await target.transform(data, metadata);
      expect(result.imageUrl).toBe('');
    });
  });

  describe('all fields validation', () => {
    it('should pass if all fields are valid', async() => {
      const data = makeValidInputDto({ name: 'Sistema ERP' });
      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(CreateClientSystemTypeInputDto);
      expect(result.name).toBe('Sistema ERP');
    });

    it('should pass when name and imageUrl are valid', async() => {
      const data = makeValidInputDto({
        name: 'Sistema ERP',
        imageUrl: 'https://example.com/img.png',
      });
      const result = await target.transform(data, metadata);
      expect(result.name).toBe('Sistema ERP');
      expect(result.imageUrl).toBe('https://example.com/img.png');
    });

    it('should accept boundary values for name (255 chars)', async() => {
      const name = 'a'.repeat(255);
      const data = makeValidInputDto({ name });
      const result = await target.transform(data, metadata);
      expect(result.name).toBe(name);
    });
  });
});
