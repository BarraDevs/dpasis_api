import { EmissionDay } from 'src/shared/value-objects/emission-day/emission-day.vo';
import { InvalidDueDateDayError } from './due-date-day.error';

export class DueDateDay {
  static readonly MIN_DAY = EmissionDay.MIN_DAY;
  static readonly MAX_DAY = EmissionDay.MAX_DAY;

  private readonly _value: number;

  constructor(value: number, emissionDay: number) {
    if (
      !Number.isInteger(value) ||
      value < DueDateDay.MIN_DAY ||
      value > DueDateDay.MAX_DAY ||
      value <= emissionDay
    ) {
      throw new InvalidDueDateDayError();
    }
    this._value = value;
  }

  public get value(): number {
    return this._value;
  }
}
