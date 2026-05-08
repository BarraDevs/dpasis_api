import { InvalidDayError } from './day.error';

export class Day {
  static readonly MIN_DAY = 1;
  static readonly MAX_DAY = 31;

  private readonly _value: number;

  constructor(value: number) {
    if (
      !Number.isInteger(value) ||
      value < Day.MIN_DAY ||
      value > Day.MAX_DAY
    ) {
      throw new InvalidDayError();
    }
    this._value = value;
  }

  public get value(): number {
    return this._value;
  }
}
