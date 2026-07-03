import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { ParamsProviderItemInstallmentId } from './params-provider-item-installment-id.dto';

const metadata: ArgumentMetadata = {
  type: 'param',
  metatype: ParamsProviderItemInstallmentId,
};

const validCompanion = {
  id: '1',
  installmentId: '2',
};

describe('ParamsProviderItemInstallmentId DTO', () => {
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
      const data = { ...validCompanion, id: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('id é obrigatório');
      });
    });

    it('should reject whitespace-only id (not treated as empty by IsNotEmpty)', async() => {
      const data = { ...validCompanion, id: '  ' };

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
      const data = { ...validCompanion, id: value };

      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(ParamsProviderItemInstallmentId);
      expect(result.id).toBe(parseInt(value));
    });

    it('should trim whitespace from id before converting', async() => {
      const data = { ...validCompanion, id: '  123  ' };

      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(ParamsProviderItemInstallmentId);
      expect(result.id).toBe(123);
    });

    it.each([
      ['0', 'id deve ser um número positivo'],
      ['-1', 'id deve ser um número positivo'],
      ['1.5', 'id deve ser um número inteiro'],
      ['abc', 'id deve ser um número'],
    ])('should reject invalid id (%s)', async(value: string, expectedMessage: string) => {
      const data = { ...validCompanion, id: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message as string[];
        expect(message).toContain(expectedMessage);
      });
    });
  });

  describe('installmentId field', () => {
    it.each([
      undefined,
      null,
      '',
    ])('should throw an error if installmentId is empty (%s)', async(value: unknown) => {
      const data = { ...validCompanion, installmentId: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('installmentId é obrigatório');
      });
    });

    it('should reject whitespace-only installmentId (not treated as empty by IsNotEmpty)', async() => {
      const data = { ...validCompanion, installmentId: '  ' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message as string[];
        expect(message).toEqual(
          expect.arrayContaining(['installmentId deve ser um número']),
        );
      });
    });

    it.each([
      '1',
      '10',
      '100',
    ])('should convert valid string numbers to integers (%s)', async(value: string) => {
      const data = { ...validCompanion, installmentId: value };

      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(ParamsProviderItemInstallmentId);
      expect(result.installmentId).toBe(parseInt(value));
    });

    it('should trim whitespace from installmentId before converting', async() => {
      const data = { ...validCompanion, installmentId: '  456  ' };

      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(ParamsProviderItemInstallmentId);
      expect(result.installmentId).toBe(456);
    });

    it.each([
      ['0', 'installmentId deve ser um número positivo'],
      ['-1', 'installmentId deve ser um número positivo'],
      ['1.5', 'installmentId deve ser um número inteiro'],
      ['abc', 'installmentId deve ser um número'],
    ])('should reject invalid installmentId (%s)', async(value: string, expectedMessage: string) => {
      const data = { ...validCompanion, installmentId: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message as string[];
        expect(message).toContain(expectedMessage);
      });
    });
  });

  it('should pass if all fields are valid', async() => {
    const data = { id: '42', installmentId: '7' };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(ParamsProviderItemInstallmentId);
    expect(result).toEqual({ id: 42, installmentId: 7 });
  });
});
