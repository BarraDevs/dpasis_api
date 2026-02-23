import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { Params } from './params.dto';

const metadata: ArgumentMetadata = {
  type: 'param',
  metatype: Params,
};

describe('Params DTO', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('id field', () => {
    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if id is empty (%s)', async(value: any) => {
      const data = { id: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('id é obrigatório');
      });
    });

    it.each([
      '1',
      '10',
      '100',
    ])('should convert valid string numbers to integers (%s)', async(value: string) => {
      const data = { id: value };

      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(Params);
      expect(result.id).toBe(parseInt(value));
    });

    it('should trim whitespace from id before converting', async() => {
      const data = { id: '  123  ' };

      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(Params);
      expect(result.id).toBe(123);
    });

    it('should pass if all fields are valid', async() => {
      const data = { id: '42' };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(Params);
      expect(result).toEqual({ id: 42 });
    });
  });
});
