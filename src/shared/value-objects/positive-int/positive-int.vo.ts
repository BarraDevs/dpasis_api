import { NumberMustBePositiveAndInt } from './positive-int.error';

export class PositiveInt {
  private readonly _value: number;

  constructor(value: number, resource: string) {
    if (!Number.isInteger(value) || value < 0) {
      throw new NumberMustBePositiveAndInt(resource);
    }
    this._value = value;
  }

  public get value(): number {
    return this._value;
  }
}
