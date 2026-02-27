import { AppException } from 'src/core/filters/app.exception';

export class BooleanVo {
  private readonly _value: boolean;

  constructor(value: unknown, fieldName: string) {
    if (typeof value !== 'boolean') {
      throw new AppException(`O campo ${fieldName} deve ser um valor booleano (true ou false)`);
    }
    this._value = value;
  }

  public get value(): boolean {
    return this._value;
  }
}
