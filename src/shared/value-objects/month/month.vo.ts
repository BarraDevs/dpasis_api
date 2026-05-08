import { InvalidMonthError } from './month.error';

export class Month {
  static readonly MIN_MONTH = 1;
  static readonly MAX_MONTH = 12;

  private readonly _value: number;

  constructor(value: number) {
    if (
      !Number.isInteger(value) ||
      value < Month.MIN_MONTH ||
      value > Month.MAX_MONTH
    ) {
      throw new InvalidMonthError();
    }
    this._value = value;
  }

  public get value(): number {
    return this._value;
  }
}
