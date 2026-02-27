import { NonEmptyString } from '../non-empty-string/non-empty-string.vo';

export class OptionalString {
  private readonly _value: string | null;

  constructor(value: string | null | undefined, fieldName: string) {
    const isProvided =
      value != null &&
      value !== undefined &&
      typeof value === 'string' &&
      value.trim().length > 0;

    if (isProvided) {
      this._value = new NonEmptyString(value, fieldName).value;
    } else {
      this._value = null;
    }
  }

  public get value(): string | null {
    return this._value;
  }
}
