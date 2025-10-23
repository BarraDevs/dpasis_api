import { InvalidPhoneError } from './phone.error';

export class Phone {
  private readonly _value: string;

  public get value(): string {
    return this._value;
  }

  constructor(phone: string) {
    if (!this.validate(phone)) {
      throw new InvalidPhoneError();
    }
    this._value = this.sanitize(phone);
  }

  private validate(phone: string): boolean {
    if (!phone) return false;

    const length = this.sanitize(phone).length;

    return length === 10 || length === 11;
  }

  private sanitize(phone: string): string {
    return phone.replace(/\D/g, '');
  }
}
