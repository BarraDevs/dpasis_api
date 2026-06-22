export class DecimalQuantity {
  private readonly _value: string;

  private constructor(formatted: string) {
    this._value = formatted;
  }

  public static fromDecimal(value: number, decimals = 4): DecimalQuantity {
    return new DecimalQuantity(value.toFixed(decimals));
  }

  public get value(): string {
    return this._value;
  }
}
