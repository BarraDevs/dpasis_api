import { DiscountType } from '../../enums/discount-type.enum';
import { InvalidDiscountValueError } from './discount-value.error';
import { DiscountValue } from './discount-value.vo';

describe('DiscountValue Value Object', () => {
  describe('constants', () => {
    it('should expose PERCENTAGE_MAX as 10000', () => {
      expect(DiscountValue.PERCENTAGE_MAX).toBe(10000);
    });

    it('should expose MONETARY_MIN as 0', () => {
      expect(DiscountValue.MONETARY_MIN).toBe(0);
    });
  });

  describe('valid values - PERCENTAGE', () => {
    it.each([
      [0, 'boundary min'],
      [1050, 'typical (10,50%)'],
      [5000, 'typical (50%)'],
      [10000, 'boundary max'],
    ])('should create DiscountValue when percentage value is %s (%s)', (value: number) => {
      const vo = new DiscountValue({ value, type: DiscountType.PERCENTAGE });

      expect(vo).toBeInstanceOf(DiscountValue);
      expect(vo.value).toBe(value);
    });
  });

  describe('valid values - MONETARY', () => {
    it.each([
      [0, 'boundary min'],
      [100, 'typical (R$ 1,00)'],
      [5000, 'typical (R$ 50,00)'],
      [100000, 'typical (R$ 1000,00)'],
    ])('should create DiscountValue when monetary value is %s (%s)', (value: number) => {
      const vo = new DiscountValue({ value, type: DiscountType.MONETARY });

      expect(vo).toBeInstanceOf(DiscountValue);
      expect(vo.value).toBe(value);
    });
  });

  describe('invalid values - not integer', () => {
    it.each([1.5, 10.5, 1050.99, -12.3, 0.01, 0.99])(
      'should throw InvalidDiscountValueError when value is decimal (%s)',
      (value: number) => {
        expect(() => new DiscountValue({ value, type: DiscountType.PERCENTAGE })).toThrow(
          InvalidDiscountValueError,
        );
        expect(() => new DiscountValue({ value, type: DiscountType.MONETARY })).toThrow(
          InvalidDiscountValueError,
        );
      },
    );

    it('should throw InvalidDiscountValueError when value is NaN', () => {
      expect(() =>
        new DiscountValue({ value: NaN, type: DiscountType.PERCENTAGE }),
      ).toThrow(InvalidDiscountValueError);
      expect(() =>
        new DiscountValue({ value: NaN, type: DiscountType.MONETARY }),
      ).toThrow(InvalidDiscountValueError);
    });
  });

  describe('invalid values - PERCENTAGE out of range', () => {
    it.each([-1, -10, -100])(
      'should throw InvalidDiscountValueError when percentage value is negative (%s)',
      (value: number) => {
        expect(() => new DiscountValue({ value, type: DiscountType.PERCENTAGE })).toThrow(
          InvalidDiscountValueError,
        );
      },
    );

    it.each([10001, 10002, 99999])(
      'should throw InvalidDiscountValueError when percentage value exceeds 10000 (%s)',
      (value: number) => {
        expect(() => new DiscountValue({ value, type: DiscountType.PERCENTAGE })).toThrow(
          InvalidDiscountValueError,
        );
      },
    );
  });

  describe('invalid values - MONETARY negative', () => {
    it.each([-1, -10, -100, -5000])(
      'should throw InvalidDiscountValueError when monetary value is negative (%s)',
      (value: number) => {
        expect(() => new DiscountValue({ value, type: DiscountType.MONETARY })).toThrow(
          InvalidDiscountValueError,
        );
      },
    );
  });

  describe('value getter', () => {
    it('should return the stored value', () => {
      const vo = new DiscountValue({ value: 1050, type: DiscountType.PERCENTAGE });

      expect(vo.value).toBe(1050);
    });

    it('should return immutable value (readonly)', () => {
      const vo = new DiscountValue({ value: 5000, type: DiscountType.MONETARY });

      expect(vo.value).toBe(5000);
    });
  });
});
