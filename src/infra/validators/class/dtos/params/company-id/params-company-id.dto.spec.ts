import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { ParamsCompanyId } from './params-company-id.dto';

const metadata: ArgumentMetadata = {
  type: 'param',
  metatype: ParamsCompanyId,
};

describe('ParamsCompanyId DTO', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('companyId field', () => {
    it.each([
      undefined,
      null,
      '',
    ])('should throw an error if companyId is empty (%s)', async(value: unknown) => {
      const data = { companyId: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyId é obrigatório');
      });
    });

    it('should reject whitespace-only companyId (not treated as empty by IsNotEmpty)', async() => {
      const data = { companyId: '  ' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message as string[];
        expect(message).toEqual(
          expect.arrayContaining(['companyId deve ser um número']),
        );
      });
    });

    it.each([
      '1',
      '10',
      '100',
    ])('should convert valid string numbers to integers (%s)', async(value: string) => {
      const data = { companyId: value };

      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(ParamsCompanyId);
      expect(result.companyId).toBe(parseInt(value));
    });

    it('should trim whitespace from companyId before converting', async() => {
      const data = { companyId: '  123  ' };

      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(ParamsCompanyId);
      expect(result.companyId).toBe(123);
    });

    it('should pass if all fields are valid', async() => {
      const data = { companyId: '42' };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(ParamsCompanyId);
      expect(result).toEqual({ companyId: 42 });
    });

    it.each([
      ['0', 'companyId deve ser um número positivo'],
      ['-1', 'companyId deve ser um número positivo'],
      ['1.5', 'companyId deve ser um número inteiro'],
      ['abc', 'companyId deve ser um número'],
    ])('should reject invalid companyId (%s)', async(value: string, expectedMessage: string) => {
      const data = { companyId: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message as string[];
        expect(message).toContain(expectedMessage);
      });
    });
  });
});
