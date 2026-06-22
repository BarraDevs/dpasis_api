import { InvalidZipCodeError } from './zip-code.error';

const ZIP_CODE_LENGTH = 8;

export class ZipCode {
  private readonly _value: string;

  constructor(raw: string) {
    const normalized = raw.replace(/\D/g, '');

    if (normalized.length !== ZIP_CODE_LENGTH) {
      throw new InvalidZipCodeError(raw);
    }

    this._value = normalized;
  }

  public get value(): string {
    return this._value;
  }
}
