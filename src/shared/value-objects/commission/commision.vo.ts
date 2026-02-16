import { InvalidCommissionError } from './commision.vo.error';

export class Commission {
  private readonly _value: number;

  constructor(value: number) {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      throw new InvalidCommissionError(value);
    }
    if (value < 0 || value > 100) {
      throw new InvalidCommissionError(value);
    }
    this._value = value;
  }

  public get value(): number {
    return this._value;
  }
}
