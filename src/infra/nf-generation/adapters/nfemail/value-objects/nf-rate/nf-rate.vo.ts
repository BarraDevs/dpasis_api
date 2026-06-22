export class NfRate {
  private readonly _value: string;

  private constructor(formatted: string) {
    this._value = formatted;
  }

  public static fromDecimal(value: number, decimals = 2): NfRate {
    return new NfRate(value.toFixed(decimals));
  }

  public get value(): string {
    return this._value;
  }
}
