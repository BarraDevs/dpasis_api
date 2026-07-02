import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateHonorificInputDto } from './create-honorific.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateHonorificInputDto,
};

function makeValidInputDto(overrides: Partial<CreateHonorificInputDto> = {}): CreateHonorificInputDto {
  return {
    name: 'Sr.',
    ...overrides,
  };
}

describe('CreateHonorificInputDto', () => {
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

    it('should throw an error if name exceeds 64 characters', async() => {
      const data = makeValidInputDto({ name: 'a'.repeat(65) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('name deve ter no máximo 64 caracteres');
      });
    });

    it('should trim whitespace from name', async() => {
      const data = makeValidInputDto({ name: '  Dra.  ' });

      const result = await target.transform(data, metadata);

      expect(result.name).toBe('Dra.');
    });

    it('should pass if name is valid', async() => {
      const data = makeValidInputDto({ name: 'Dr.' });

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(CreateHonorificInputDto);
      expect(result.name).toBe('Dr.');
    });
  });
});
