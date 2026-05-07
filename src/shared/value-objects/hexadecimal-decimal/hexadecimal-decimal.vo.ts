import {
  DecimalOutOfHexadecimalRangeError,
  InvalidHexadecimalStringError,
} from './hexadecimal-decimal.error';

const MAX_HEX_DIGITS = 8;
const MAX_UNSIGNED_32 = 0xffffffff;

export class HexadecimalDecimal {
  private readonly _decimal: number;

  private constructor(decimal: number) {
    this._decimal = decimal;
  }

  public static fromDecimal(value: number): HexadecimalDecimal {
    if (!Number.isInteger(value) || value < 0 || value > MAX_UNSIGNED_32) {
      throw new DecimalOutOfHexadecimalRangeError();
    }
    return new HexadecimalDecimal(value);
  }

  public static fromHex(raw: string): HexadecimalDecimal {
    const normalized = HexadecimalDecimal.normalizeHex(raw);

    if (normalized.length === 0 || normalized.length > MAX_HEX_DIGITS) {
      throw new InvalidHexadecimalStringError();
    }

    if (!/^[0-9A-F]+$/.test(normalized)) {
      throw new InvalidHexadecimalStringError();
    }

    const decimal = Number.parseInt(normalized, 16);

    if (!Number.isSafeInteger(decimal)) {
      throw new InvalidHexadecimalStringError();
    }

    return new HexadecimalDecimal(decimal);
  }

  private static normalizeHex(raw: string): string {
    let trimmed = raw.trim();

    if (trimmed.toLowerCase().startsWith('0x')) {
      trimmed = trimmed.slice(2);
    }

    return trimmed.toUpperCase();
  }

  public get decimal(): number {
    return this._decimal;
  }

  public get hex(): string {
    return this._decimal.toString(16).toUpperCase();
  }

  public equals(other: HexadecimalDecimal): boolean {
    return this._decimal === other._decimal;
  }
}
