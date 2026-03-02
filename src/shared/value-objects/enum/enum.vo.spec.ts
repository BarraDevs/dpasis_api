import { AppException } from 'src/core/filters/app.exception';
import { Enum } from './enum.vo';

enum TestEnumKeyEqualsValue {
  PF = 'PF',
  PJ = 'PJ',
}

enum TestEnumKeyDiffersFromValue {
  INDIVIDUAL = 'Avulso',
  CONTRACT = 'Contrato',
}

describe('Enum Value Object', () => {
  const fieldName = 'type';

  describe('empty value', () => {
    it.each(
      [
        null,
        undefined,
        '',
      ]
    )('should throw AppException when value is empty (%s)', (value: unknown) => {
      expect(() => new Enum(value as string, TestEnumKeyEqualsValue, fieldName)).toThrow(AppException);
      expect(() => new Enum(value as string, TestEnumKeyEqualsValue, fieldName)).toThrow(`O campo ${fieldName} não pode ser vazio`);
    });
  });

  describe('invalid value', () => {
    it('should throw AppException when value is not in enum', () => {
      expect(() => new Enum('INVALID', TestEnumKeyEqualsValue, fieldName)).toThrow(AppException);
      expect(() => new Enum('INVALID', TestEnumKeyEqualsValue, fieldName)).toThrow(`O campo ${fieldName} não é válido. Valores válidos: PF, PJ`);
    });

    it('should throw AppException when value is not in enum (key differs from value)', () => {
      expect(() => new Enum('INVALID', TestEnumKeyDiffersFromValue, fieldName)).toThrow(AppException);
      expect(() => new Enum('INVALID', TestEnumKeyDiffersFromValue, fieldName)).toThrow(/O campo type não é válido. Valores válidos:.*INDIVIDUAL.*Avulso/);
    });
  });

  describe('enum where key equals value', () => {
    it.each(['PF', 'PJ'])('should accept value when key equals value (%s)', (value: string) => {
      const vo = new Enum(value, TestEnumKeyEqualsValue, fieldName);

      expect(vo).toBeInstanceOf(Enum);
      expect(vo.value).toBe(value);
    });
  });

  describe('enum where key differs from value', () => {
    it.each(['Avulso', 'Contrato'])(
      'should accept and return value when passing enum value (%s)',
      (value: string) => {
        const vo = new Enum(value, TestEnumKeyDiffersFromValue, fieldName);

        expect(vo).toBeInstanceOf(Enum);
        expect(vo.value).toBe(value);
      },
    );

    it.each([
      ['INDIVIDUAL', 'Avulso'],
      ['CONTRACT', 'Contrato'],
    ])('should accept key and normalize to value when passing enum key (%s -> %s)', (key, expectedValue) => {
      const vo = new Enum(key, TestEnumKeyDiffersFromValue, fieldName);

      expect(vo).toBeInstanceOf(Enum);
      expect(vo.value).toBe(expectedValue);
    });
  });

  describe('fieldName in error message', () => {
    it('should include fieldName in empty value error', () => {
      expect(() => new Enum('', TestEnumKeyEqualsValue, 'invoiceType')).toThrow('O campo invoiceType não pode ser vazio');
    });

    it('should include fieldName in invalid value error', () => {
      expect(() => new Enum('INVALID', TestEnumKeyEqualsValue, 'invoiceType')).toThrow('O campo invoiceType não é válido. Valores válidos: PF, PJ');
    });
  });
});
