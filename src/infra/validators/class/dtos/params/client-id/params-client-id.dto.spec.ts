import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { ParamsClientId } from './params-client-id.dto';

const metadata: ArgumentMetadata = {
  type: 'param',
  metatype: ParamsClientId,
};

describe('ParamsClientId DTO', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('clientId field', () => {
    it.each([
      undefined,
      null,
      '',
    ])('should throw an error if clientId is empty (%s)', async(value: unknown) => {
      const data = { clientId: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('clientId é obrigatório');
      });
    });

    it('should reject whitespace-only clientId (not treated as empty by IsNotEmpty)', async() => {
      const data = { clientId: '  ' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message as string[];
        expect(message).toEqual(
          expect.arrayContaining(['clientId deve ser um número']),
        );
      });
    });

    it.each([
      '1',
      '10',
      '100',
    ])('should convert valid string numbers to integers (%s)', async(value: string) => {
      const data = { clientId: value };

      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(ParamsClientId);
      expect(result.clientId).toBe(parseInt(value));
    });

    it('should trim whitespace from clientId before converting', async() => {
      const data = { clientId: '  123  ' };

      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(ParamsClientId);
      expect(result.clientId).toBe(123);
    });

    it('should pass if all fields are valid', async() => {
      const data = { clientId: '42' };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(ParamsClientId);
      expect(result).toEqual({ clientId: 42 });
    });

    it.each([
      ['0', 'clientId deve ser um número positivo'],
      ['-1', 'clientId deve ser um número positivo'],
      ['1.5', 'clientId deve ser um número inteiro'],
      ['abc', 'clientId deve ser um número'],
    ])('should reject invalid clientId (%s)', async(value: string, expectedMessage: string) => {
      const data = { clientId: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message as string[];
        expect(message).toContain(expectedMessage);
      });
    });
  });
});
