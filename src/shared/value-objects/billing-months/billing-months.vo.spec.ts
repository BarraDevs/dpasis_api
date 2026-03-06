import { InvalidBillingMonthsError } from './billing-months.error';
import { BillingMonths } from './billing-months.vo';

describe('BillingMonths Value Object', () => {
  describe('validation - required', () => {
    it('should throw when required and months is empty', () => {
      expect(() => new BillingMonths([], true)).toThrow(InvalidBillingMonthsError);
    });

    it('should throw when required and months contains 0', () => {
      expect(() => new BillingMonths([1, 0, 5], true)).toThrow(InvalidBillingMonthsError);
    });

    it('should throw when required and months contains 13', () => {
      expect(() => new BillingMonths([1, 13, 5], true)).toThrow(InvalidBillingMonthsError);
    });

    it('should throw when required and months contains decimal', () => {
      expect(() => new BillingMonths([1, 5.5, 9], true)).toThrow(InvalidBillingMonthsError);
    });

    it('should deduplicate and sort when required', () => {
      const vo = new BillingMonths([9, 5, 1, 5, 9], true);

      expect(vo.value).toEqual([1, 5, 9]);
    });
  });

  describe('validation - not required', () => {
    it('should create empty when required is false', () => {
      const vo = new BillingMonths([], false);

      expect(vo.value).toEqual([]);
      expect(vo.isEmpty()).toBe(true);
    });
  });

  describe('hasBillingInMonth', () => {
    it('should return true when month is in the list', () => {
      const vo = new BillingMonths([1, 5, 9], true);

      expect(vo.hasBillingInMonth(1)).toBe(true);
      expect(vo.hasBillingInMonth(5)).toBe(true);
      expect(vo.hasBillingInMonth(9)).toBe(true);
      expect(vo.hasBillingInMonth(9)).toBe(true);
    });

    it('should return false when month is not in the list', () => {
      const vo = new BillingMonths([1, 5, 9], true);

      expect(vo.hasBillingInMonth(2)).toBe(false);
      expect(vo.hasBillingInMonth(12)).toBe(false);
    });
  });

  describe('containsMonth', () => {
    it('should return same result as hasBillingInMonth', () => {
      const vo = new BillingMonths([3, 6, 9, 12], true);

      expect(vo.containsMonth(6)).toBe(true);
      expect(vo.hasBillingInMonth(6)).toBe(true);
      expect(vo.containsMonth(7)).toBe(false);
      expect(vo.hasBillingInMonth(7)).toBe(false);
    });
  });

  describe('isEmpty', () => {
    it('should return true when no months', () => {
      const vo = new BillingMonths([], false);

      expect(vo.isEmpty()).toBe(true);
    });

    it('should return false when has months', () => {
      const vo = new BillingMonths([1], true);

      expect(vo.isEmpty()).toBe(false);
    });
  });

  describe('hasOnlyOneMonth', () => {
    it('should return true when has exactly one month', () => {
      const vo = new BillingMonths([6], true);

      expect(vo.hasOnlyOneMonth()).toBe(true);
    });

    it('should return false when has multiple months', () => {
      const vo = new BillingMonths([1, 6, 12], true);

      expect(vo.hasOnlyOneMonth()).toBe(false);
    });
  });

  describe('hasAllMonths', () => {
    it('should return true when has all 12 months', () => {
      const vo = new BillingMonths(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        true,
      );

      expect(vo.hasAllMonths()).toBe(true);
    });

    it('should return false when has less than 12 months', () => {
      const vo = new BillingMonths([1, 6, 12], true);

      expect(vo.hasAllMonths()).toBe(false);
    });
  });

  describe('hasBillingInFirstQuarter', () => {
    it('should return true when has month 1, 2 or 3', () => {
      const vo = new BillingMonths([1, 6, 12], true);

      expect(vo.hasBillingInFirstQuarter()).toBe(true);
    });

    it('should return false when has no month in first quarter', () => {
      const vo = new BillingMonths([9, 12], true);

      expect(vo.hasBillingInFirstQuarter()).toBe(false);
    });
  });

  describe('hasBillingInSecondQuarter', () => {
    it('should return true when has month 4, 5 or 6', () => {
      const vo = new BillingMonths([9, 5, 12], true);

      expect(vo.hasBillingInSecondQuarter()).toBe(true);
    });

    it('should return false when has no month in second quarter', () => {
      const vo = new BillingMonths([1, 9, 12], true);

      expect(vo.hasBillingInSecondQuarter()).toBe(false);
    });
  });

  describe('hasBillingInThirdQuarter', () => {
    it('should return true when has month 7, 8 or 9', () => {
      const vo = new BillingMonths([1, 9, 12], true);

      expect(vo.hasBillingInThirdQuarter()).toBe(true);
    });

    it('should return false when has no month in third quarter', () => {
      const vo = new BillingMonths([1, 6, 12], true);

      expect(vo.hasBillingInThirdQuarter()).toBe(false);
    });
  });

  describe('hasBillingInLastQuarter', () => {
    it('should return true when has month 10, 11 or 12', () => {
      const vo = new BillingMonths([1, 5, 12], true);

      expect(vo.hasBillingInLastQuarter()).toBe(true);
    });

    it('should return false when has no month in last quarter', () => {
      const vo = new BillingMonths([1, 5, 9], true);

      expect(vo.hasBillingInLastQuarter()).toBe(false);
    });
  });

  describe('monthCount', () => {
    it('should return the number of months', () => {
      const vo = new BillingMonths([1, 6, 12], true);

      expect(vo.monthCount()).toBe(3);
    });

    it('should return 0 when empty', () => {
      const vo = new BillingMonths([], false);

      expect(vo.monthCount()).toBe(0);
    });
  });

  describe('value', () => {
    it('should return a copy of the array', () => {
      const vo = new BillingMonths([1, 5, 9], true);
      const value = vo.value;

      value.push(12);

      expect(vo.value).toEqual([1, 5, 9]);
    });
  });

  describe('constants', () => {
    it('should expose MIN_MONTH and MAX_MONTH', () => {
      expect(BillingMonths.MIN_MONTH).toBe(1);
      expect(BillingMonths.MAX_MONTH).toBe(12);
    });
  });
});
