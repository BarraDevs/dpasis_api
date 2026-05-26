import { DateTime } from 'luxon';
import { InvalidUtcCalendarDateError, InvalidUtcCalendarDateFormatError } from './utc-calendar-date.error';

const YYYY_MM_DD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class UtcCalendarDate {
  private readonly _value: Date;

  constructor(value: string, fieldName: string) {
    const normalized = value.trim();
    if (!YYYY_MM_DD_PATTERN.test(normalized)) {
      throw new InvalidUtcCalendarDateFormatError(fieldName);
    }

    const dt = DateTime.fromISO(normalized, { zone: 'utc' }).startOf('day');
    if (!dt.isValid) {
      throw new InvalidUtcCalendarDateError(fieldName);
    }

    this._value = dt.toJSDate();
  }

  public get value(): Date {
    return this._value;
  }

  public get isoDate(): string {
    return DateTime.fromJSDate(this._value, { zone: 'utc' }).toISODate()!;
  }
}
