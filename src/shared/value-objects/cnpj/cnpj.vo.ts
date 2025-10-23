import { InvalidCnpjError } from './cnpj.error';

const CNPJ_LENGTH = 14;

export class CNPJ {
  private readonly _value: string;

  private multipliesFirstDigit = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  private multipliesSecondDigit = [6, ...this.multipliesFirstDigit];

  public get value(): string {
    return this._value;
  }

  constructor(rawCnpj: string) {
    const cnpj = this.sanitize(rawCnpj);

    if (!this.validate(cnpj)) {
      throw new InvalidCnpjError();
    }
    this._value = cnpj;
  }

  private sanitize(cnpj: string): string {
    return cnpj?.replace(/[\s./-]*/gim, '');
  }

  private validate(cnpj: string): boolean {
    if (!cnpj) return false;
    if (cnpj.length !== CNPJ_LENGTH) return false;
    if (this.allDigitsAreEqual(cnpj)) return false;

    const digits = cnpj.split('').map(Number);

    const firstDigit = this.calculateDigit(cnpj, 12, this.multipliesFirstDigit);
    if (firstDigit !== digits[12]) return false;

    const secondDigit = this.calculateDigit(cnpj, 13, this.multipliesSecondDigit);
    if (secondDigit !== digits[13]) return false;

    return true;
  }

  private allDigitsAreEqual(cnpj: string): boolean {
    return cnpj.split('').every((digit) => digit === cnpj[0]);
  }

  private calculateDigit(cnpj: string, length: number, multipliers: number[]): number {
    // https://www.macoratti.net/alg_cnpj.htm
    let sum = 0;
    let rest = 0;

    for (let i = 0; i < length; i++) {
      const digit = Number(cnpj.substring(i, i + 1));
      sum += digit * multipliers[i];
    }

    rest = sum % 11;
    if (rest < 2) rest = 0;
    else rest = 11 - rest;

    return rest;
  }
}
