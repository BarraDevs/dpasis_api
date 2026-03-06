import { InvalidDueDateDayError } from './due-date-day.error';
import { DueDateDay } from './due-date-day.vo';

describe('DueDateDay Value Object', () => {
  describe('invalid values - out of range', () => {
    it.each([0, -1, -10])(
      'should throw InvalidDueDateDayError when value is less than 1 (%s)',
      (value: number) => {
        expect(() => new DueDateDay(value, 1)).toThrow(InvalidDueDateDayError);
        expect(() => new DueDateDay(value, 1)).toThrow(
          'Dia de vencimento deve ser entre 1 e 31 e maior que o dia de emissão.',
        );
      },
    );

    it.each([32, 33, 100])(
      'should throw InvalidDueDateDayError when value is greater than 31 (%s)',
      (value: number) => {
        expect(() => new DueDateDay(value, 1)).toThrow(InvalidDueDateDayError);
      },
    );
  });

  describe('invalid values - not integer', () => {
    it.each([1.5, 15.5, 30.9, -12.3, 0.01, 0.99])(
      'should throw InvalidDueDateDayError when value is decimal (%s)',
      (value: number) => {
        expect(() => new DueDateDay(value, 1)).toThrow(InvalidDueDateDayError);
      },
    );

    it('should throw InvalidDueDateDayError when value is NaN', () => {
      expect(() => new DueDateDay(NaN, 1)).toThrow(InvalidDueDateDayError);
    });
  });

  describe('invalid values - not greater than emissionDay', () => {
    it('should throw InvalidDueDateDayError when value equals emissionDay', () => {
      expect(() => new DueDateDay(15, 15)).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidDueDateDayError when value is less than emissionDay', () => {
      expect(() => new DueDateDay(10, 15)).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidDueDateDayError when value is 1 and emissionDay is 1', () => {
      expect(() => new DueDateDay(1, 1)).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidDueDateDayError when value is 31 and emissionDay is 31', () => {
      expect(() => new DueDateDay(31, 31)).toThrow(InvalidDueDateDayError);
    });
  });

  describe('valid values', () => {
    it.each([
      [2, 1],
      [15, 5],
      [31, 30],
      [16, 15],
      [31, 1],
    ])(
      'should create DueDateDay when value (%s) is greater than emissionDay (%s)',
      (value: number, emissionDay: number) => {
        const dueDateDay = new DueDateDay(value, emissionDay);

        expect(dueDateDay).toBeInstanceOf(DueDateDay);
        expect(dueDateDay.value).toBe(value);
      },
    );

    it('should accept boundary value 2 when emissionDay is 1', () => {
      const dueDateDay = new DueDateDay(2, 1);

      expect(dueDateDay.value).toBe(2);
    });

    it('should accept boundary value 31 when emissionDay is 30', () => {
      const dueDateDay = new DueDateDay(31, 30);

      expect(dueDateDay.value).toBe(31);
    });

    it('should expose MIN_DAY and MAX_DAY constants', () => {
      expect(DueDateDay.MIN_DAY).toBe(1);
      expect(DueDateDay.MAX_DAY).toBe(31);
    });
  });
});
