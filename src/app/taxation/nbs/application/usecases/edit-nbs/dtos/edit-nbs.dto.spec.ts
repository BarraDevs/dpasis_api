import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditNbsInputDto } from './edit-nbs.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditNbsInputDto,
};

function makeValidInputDto(overrides: Partial<EditNbsInputDto> = {}): EditNbsInputDto {
  return {
    code: '1012-1/01',
    description: 'Fabricação de produtos alimentícios',
    ...overrides,
  };
}

describe('EditNbsInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('code field', () => {
    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if code is empty (%s)', async(value: any) => {
      const data = makeValidInputDto({ code: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('code é obrigatório');
      });
    });

    it('should throw an error if code exceeds 20 characters', async() => {
      const data = makeValidInputDto({ code: 'a'.repeat(21) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('code deve ter no máximo 20 caracteres');
      });
    });

    it('should trim whitespace from code', async() => {
      const data = makeValidInputDto({ code: '  1012-1/01  ' });

      const result = await target.transform(data, metadata);

      expect(result.code).toBe('1012-1/01');
    });
  });

  describe('description field', () => {
    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if description is empty (%s)', async(value: any) => {
      const data = makeValidInputDto({ description: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('description é obrigatório');
      });
    });

    it('should throw an error if description exceeds 500 characters', async() => {
      const data = makeValidInputDto({ description: 'a'.repeat(501) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('description deve ter no máximo 500 caracteres');
      });
    });
  });

  describe('all fields validation', () => {
    it('should pass if all fields are valid', async() => {
      const data = makeValidInputDto({
        code: '1012-1/01',
        description: 'Fabricação de produtos alimentícios',
      });

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(EditNbsInputDto);
      expect(result.code).toBe('1012-1/01');
      expect(result.description).toBe('Fabricação de produtos alimentícios');
    });
  });
});
