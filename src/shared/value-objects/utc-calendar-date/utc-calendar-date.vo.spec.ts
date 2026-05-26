import {
  InvalidUtcCalendarDateError,
  InvalidUtcCalendarDateFormatError,
} from './utc-calendar-date.error';
import { UtcCalendarDate } from './utc-calendar-date.vo';

describe('UtcCalendarDate Value Object', () => {
  const fieldName = 'createdAt';

  it('should parse yyyy-mm-dd to UTC start of day', () => {
    const sut = new UtcCalendarDate('2020-03-15', fieldName);

    expect(sut.value).toEqual(new Date('2020-03-15T00:00:00.000Z'));
    expect(sut.isoDate).toBe('2020-03-15');
  });

  it('should trim surrounding whitespace', () => {
    const sut = new UtcCalendarDate('  2020-03-15  ', fieldName);

    expect(sut.value).toEqual(new Date('2020-03-15T00:00:00.000Z'));
  });

  it.each(['03/15/2020', '2020-3-5', '2020-03-15T10:00:00.000Z', ''])(
    'should throw InvalidUtcCalendarDateFormatError for invalid format (%s)',
    (value: string) => {
      expect(() => new UtcCalendarDate(value, fieldName)).toThrow(InvalidUtcCalendarDateFormatError);
      expect(() => new UtcCalendarDate(value, fieldName)).toThrow(
        'O campo createdAt deve estar no formato yyyy-mm-dd',
      );
    },
  );

  it('should throw InvalidUtcCalendarDateError for invalid calendar date', () => {
    expect(() => new UtcCalendarDate('2020-02-30', fieldName)).toThrow(InvalidUtcCalendarDateError);
    expect(() => new UtcCalendarDate('2020-02-30', fieldName)).toThrow(
      'O campo createdAt deve ser uma data válida',
    );
  });

  it('should include custom field name in format error message', () => {
    expect(() => new UtcCalendarDate('invalid', 'validityDate')).toThrow(
      'O campo validityDate deve estar no formato yyyy-mm-dd',
    );
  });
});
