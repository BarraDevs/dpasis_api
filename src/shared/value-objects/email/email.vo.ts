import { InvalidEmailError } from './email.error';

export class Email {
  private readonly _value: string;

  public get value(): string {
    return this._value;
  }

  constructor(email: string) {
    if (!this.validate(email)) {
      throw new InvalidEmailError();
    }
    this._value = email;
  }

  private validate(email: string): boolean {
    const regex = new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
    return regex.test(email);
  }
}
