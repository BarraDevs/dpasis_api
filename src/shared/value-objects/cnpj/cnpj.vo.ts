import { InvalidCnpjError } from './cnpj.error';

export class CNPJ {
  // Alphanumeric CNPJ (Receita Federal, IN 2.229/2024, valid from July 2026):
  // first 12 positions are alphanumeric [A-Z0-9], last 2 are numeric check digits.
  private readonly FORMAT = /^[A-Z0-9]{12}[0-9]{2}$/;
  private readonly ASCII_ZERO = 48;
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
    return cnpj?.replace(/[\s./-]/gim, '').toUpperCase();
  }

  private validate(cnpj: string): boolean {
    if (!cnpj) return false;
    if (!this.FORMAT.test(cnpj)) return false;
    if (this.allCharsAreEqual(cnpj)) return false;

    const firstDigit = this.calculateDigit(cnpj, 12, this.MULTIPLIES_FIRST_DIGIT);
    if (firstDigit !== Number(cnpj[12])) return false;

    const secondDigit = this.calculateDigit(cnpj, 13, this.MULTIPLIES_SECOND_DIGIT);
    if (secondDigit !== Number(cnpj[13])) return false;

    return true;
  }

  private allCharsAreEqual(cnpj: string): boolean {
    return cnpj.split('').every((char) => char === cnpj[0]);
  }

  private calculateDigit(cnpj: string, length: number, multipliers: number[]): number {
    // Module 11 over the char value = ASCII code - 48 (digits 0-9 -> 0-9, A-Z -> 17-42).
    // https://www.serpro.gov.br/menu/noticias/videos/calculodvcnpjalfanaumerico.pdf
    let sum = 0;
    let rest = 0;

    for (let i = 0; i < length; i++) {
      const value = cnpj.charCodeAt(i) - this.ASCII_ZERO;
      sum += value * multipliers[i];
    }

    rest = sum % 11;
    if (rest < 2) rest = 0;
    else rest = 11 - rest;

    return rest;
  }
}
