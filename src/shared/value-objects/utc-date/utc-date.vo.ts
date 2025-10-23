import { DateTime } from 'luxon';
import { InvalidDateError, InvalidDaysQuantityError, InvalidMonthsQuantityError } from './utc-date.error';

export class UTCDate {
  private readonly _value: DateTime;

  public static create(): UTCDate {
    return new UTCDate();
  }

  public static from(value: Date): UTCDate {
    return new UTCDate(DateTime.fromJSDate(value, { zone: 'utc' }));
  }

  private constructor(value?: DateTime) {
    if (value && !DateTime.isDateTime(value)) {
      throw new InvalidDateError();
    }
    this._value = value ?? DateTime.utc();
  }

  public get value(): Date {
    return this._value.toJSDate();
  }

  public get isoString(): string {
    return this.value.toISOString().split('T')[0];
  }

  public addDays(days: number): UTCDate {
    if (!days || days <= 0) {
      throw new InvalidDaysQuantityError();
    }
    if (!Number.isInteger(days)) {
      throw new InvalidDaysQuantityError();
    }
    if (Number.isNaN(days)) {
      throw new InvalidDaysQuantityError();
    }
    return new UTCDate(this._value.plus({ days }));
  }

  public addMonths(months: number): UTCDate {
    if (!months || months <= 0) {
      throw new InvalidMonthsQuantityError();
    }
    if (!Number.isInteger(months)) {
      throw new InvalidMonthsQuantityError();
    }
    if (Number.isNaN(months)) {
      throw new InvalidMonthsQuantityError();
    }
    return new UTCDate(this._value.plus({ months }));
  }

  public isBefore(date: UTCDate, inclusive: boolean = false): boolean {
    if (!date) {
      throw new InvalidDateError();
    }
    if (!(date instanceof UTCDate)) {
      throw new InvalidDateError();
    }

    if (inclusive) {
      return this._value <= date._value;
    }
    else {
      return this._value < date._value;
    }
  }

  public isAfter(date: UTCDate, inclusive: boolean = false): boolean {
    if (!date) {
      throw new InvalidDateError();
    }
    if (!(date instanceof UTCDate)) {
      throw new InvalidDateError();
    }

    if (inclusive) {
      return this._value >= date._value;
    }
    else {
      return this._value > date._value;
    }
  }
}
