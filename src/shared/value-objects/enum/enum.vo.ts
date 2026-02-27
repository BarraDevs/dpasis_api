import { AppException } from 'src/core/filters/app.exception';

type EnumClass<T extends string> = Record<T, string>;

export class Enum<T extends string> {
  private readonly _value: T;
  private readonly _enumList: EnumClass<T>;

  constructor(value: T, enumClass: EnumClass<T>, fieldName: string) {
    this._value = value;
    this._enumList = enumClass;
    this.verify(fieldName);
  }

  private verify(fieldName: string): void {
    if (!this._value) {
      throw new AppException(`O campo ${fieldName} não pode ser vazio`);
    }
    if (!Object.values(this._enumList).includes(this._value)) {
      throw new AppException(`O campo ${fieldName} não é válido. Valores válidos: ${Object.values(this._enumList).join(', ')}`);
    }
  }

  public get value(): T {
    return this._value;
  }
}
