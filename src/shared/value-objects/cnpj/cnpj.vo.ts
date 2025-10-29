import { InvalidCnpjError } from './cnpj.error';

export class CNPJ {
  private readonly LENGTH = 14;
  private readonly MULTIPLIES_FIRST_DIGIT = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  private readonly MULTIPLIES_SECOND_DIGIT = [6, ...this.MULTIPLIES_FIRST_DIGIT];
  private readonly _value: string;

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
    if (cnpj.length !== this.LENGTH) return false;
    if (this.allDigitsAreEqual(cnpj)) return false;

    const digits = cnpj.split('').map(Number);

    const firstDigit = this.calculateDigit(cnpj, 12, this.MULTIPLIES_FIRST_DIGIT);
    if (firstDigit !== digits[12]) return false;

    const secondDigit = this.calculateDigit(cnpj, 13, this.MULTIPLIES_SECOND_DIGIT);
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
