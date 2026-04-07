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
    ])('should throw an error if id is empty (%s)', async(value: unknown) => {
      const data = { id: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('id é obrigatório');
      });
    });

    it('should reject whitespace-only id (not treated as empty by IsNotEmpty)', async() => {
      const data = { id: '  ' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message as string[];
        expect(message).toEqual(
          expect.arrayContaining(['id deve ser um número']),
        );
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

    it.each([
      ['0', 'id deve ser um número positivo'],
      ['-1', 'id deve ser um número positivo'],
      ['1.5', 'id deve ser um número inteiro'],
      ['abc', 'id deve ser um número'],
    ])('should reject invalid id (%s)', async(value: string, expectedMessage: string) => {
      const data = { id: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message as string[];
        expect(message).toContain(expectedMessage);
      });
    });
  });
});
