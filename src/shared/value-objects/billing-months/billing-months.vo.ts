import { InvalidBillingMonthsError } from './billing-months.error';

export class BillingMonths {
  static readonly MIN_MONTH = 1;
  static readonly MAX_MONTH = 12;

  private readonly _value: number[];

  constructor(months: number[], required: boolean) {
    if (required) {
      if (!Array.isArray(months) || months.length === 0) {
        throw new InvalidBillingMonthsError();
      }
      const validMonths = months.filter(
        m =>
          Number.isInteger(m) &&
          m >= BillingMonths.MIN_MONTH &&
          m <= BillingMonths.MAX_MONTH,
      );
      if (validMonths.length !== months.length) {
        throw new InvalidBillingMonthsError();
      }
      this._value = [...new Set(validMonths)].sort((a, b) => a - b);
    } else {
      this._value = [];
    }
  }

  public get value(): number[] {
    return [...this._value];
  }

  public hasBillingInMonth(month: number): boolean {
    return this._value.includes(month);
  }

  public containsMonth(month: number): boolean {
    return this.hasBillingInMonth(month);
  }

  public isEmpty(): boolean {
    return this._value.length === 0;
  }

  public hasOnlyOneMonth(): boolean {
    return this._value.length === 1;
  }

  public hasAllMonths(): boolean {
    return this._value.length === BillingMonths.MAX_MONTH;
  }

  public hasBillingInFirstQuarter(): boolean {
    return this._value.some(m => m >= 1 && m <= 3);
  }

  public hasBillingInSecondQuarter(): boolean {
    return this._value.some(m => m >= 4 && m <= 6);
  }

  public hasBillingInThirdQuarter(): boolean {
    return this._value.some(m => m >= 7 && m <= 9);
  }

  public hasBillingInLastQuarter(): boolean {
    return this._value.some(m => m >= 10 && m <= 12);
  }

  public monthCount(): number {
    return this._value.length;
  }
}
