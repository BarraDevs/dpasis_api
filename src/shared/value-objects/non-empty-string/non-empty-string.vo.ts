import { AppException } from 'src/core/filters/app.exception';

export class NonEmptyString {
  private readonly _value: string;

  constructor(value: string, fieldName: string) {
    if (!value || typeof value !== 'string' || !value.trim().length) {
      throw new AppException(`O campo ${fieldName} não pode ser vazio`);
    }
    this._value = value;
  }

  public get value(): string {
    return this._value;
  }
}
