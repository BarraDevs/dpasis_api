import { InvalidEmissionDayError } from './emission-day.error';

export class EmissionDay {
  static readonly MIN_DAY = 1;
  static readonly MAX_DAY = 31;

  private readonly _value: number;

  constructor(value: number) {
    if (
      !Number.isInteger(value) ||
      value < EmissionDay.MIN_DAY ||
      value > EmissionDay.MAX_DAY
    ) {
      throw new InvalidEmissionDayError();
    }
    this._value = value;
  }

  public get value(): number {
    return this._value;
  }
}
