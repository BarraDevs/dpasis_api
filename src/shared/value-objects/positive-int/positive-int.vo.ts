import { NumberMustBePositiveAndInt } from './positive-int.error';

export class PositiveInt {
  private readonly _value: number;

  constructor(value: number, resource: string, includeZero = false) {
    if (!Number.isInteger(value) || value < (includeZero ? 0 : 1)) {
      throw new NumberMustBePositiveAndInt(resource);
    }
    this._value = value;
  }

  public get value(): number {
    return this._value;
  }
}
