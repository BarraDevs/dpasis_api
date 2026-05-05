const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export class VoucherCode {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public get value(): string {
    return this._value;
  }

  /**
   * Cria um VoucherCode a partir do identificador da revenda e do ano vigente.
   * Identificador vazio produz voucher vazio (revenda sem código não gera voucher).
   */
  static fromResaleCode(identifier: string, year: number): VoucherCode {
    if (!identifier.trim()) {
      return new VoucherCode('');
    }
    const input = identifier + year.toString();
    return new VoucherCode(VoucherCode.encode(input));
  }

  /**
   * Codificação Base58 customizada — reimplementação fiel ao VB.NET original (DpaVoucher).
   * NÃO é Base58Check (Bitcoin). Opera sobre bytes UTF-8 com divisão longa em base 256 → 58.
   * Nunca usar libs externas (bs58, base-x) — produzem saída incompatível.
   */
  private static encode(input: string): string {
    const bytes = Buffer.from(input, 'utf8');
    if (bytes.length === 0) return '';

    let zeros = 0;
    while (zeros < bytes.length && bytes[zeros] === 0) {
      zeros++;
    }

    const temp = Array.from(bytes);
    let result = '';
    let start = zeros;

    while (start < temp.length) {
      let remainder = 0;
      for (let i = start; i < temp.length; i++) {
        const num = temp[i] & 0xff;
        const acc = remainder * 256 + num;
        temp[i] = Math.floor(acc / 58);
        remainder = acc % 58;
      }
      result = BASE58_ALPHABET[remainder] + result;
      while (start < temp.length && temp[start] === 0) {
        start++;
      }
    }

    // Uppercase for display on labels/printouts — matches legacy behavior where
    // the application uppercased the result before persisting (produces chars like 'O'
    // which are outside the Base58 alphabet but consistent with the VB.NET output).
    return ('1'.repeat(zeros) + result).toUpperCase();
  }
}
