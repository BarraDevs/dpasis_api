export class DecimalMoney {
  private readonly _value: string;

  private constructor(formatted: string) {
    this._value = formatted;
  }

  public static fromDecimal(value: number, decimals = 2): DecimalMoney {
    return new DecimalMoney(value.toFixed(decimals));
  }

  public static fromCents(valueInCents: number, decimals = 2): DecimalMoney {
    return new DecimalMoney((valueInCents / 100).toFixed(decimals));
  }

  public get value(): string {
    return this._value;
  }
}
