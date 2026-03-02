import { AppException } from 'src/core/filters/app.exception';

type EnumClass<T extends string> = Record<string, T>;

export class Enum<T extends string> {
  private readonly _value: T;
  private readonly _enumList: EnumClass<T>;

  constructor(value: string, enumClass: EnumClass<T>, fieldName: string) {
    this._enumList = enumClass;
    this._value = this.normalize(value, fieldName);
  }

  private normalize(value: string, fieldName: string): T {
    if (!value) {
      throw new AppException(`O campo ${fieldName} não pode ser vazio`);
    }

    const values = Object.values(this._enumList) as string[];
    const keys = Object.keys(this._enumList).filter(k => !values.includes(k)) as string[];

    if (values.includes(value)) {
      return value as T;
    }
    if (keys.includes(value) && this._enumList[value]) {
      return this._enumList[value] as T;
    }

    const validOptions = [...new Set([...keys, ...values])].join(', ');
    throw new AppException(`O campo ${fieldName} não é válido. Valores válidos: ${validOptions}`);
  }

  public get value(): T {
    return this._value;
  }
}
