import {
  DecimalOutOfHexadecimalRangeError,
  InvalidHexadecimalStringError,
} from './hexadecimal-decimal.error';
import { HexadecimalDecimal } from './hexadecimal-decimal.vo';

describe('HexadecimalDecimal Value Object', () => {
  it('should be defined', () => {
    expect(HexadecimalDecimal).toBeDefined();
  });

  describe('fromDecimal', () => {
    it.each([
      [0, '0'],
      [1, '1'],
      [10, 'A'],
      [16, '10'],
      [255, 'FF'],
      [256, '100'],
      [4096, '1000'],
      [65535, 'FFFF'],
      [65536, '10000'],
      [16777215, 'FFFFFF'],
      [4294967295, 'FFFFFFFF'],
    ])('should convert decimal %s to hex %s', (decimal: number, hex: string) => {
      const vo = HexadecimalDecimal.fromDecimal(decimal);

      expect(vo.decimal).toBe(decimal);
      expect(vo.hex).toBe(hex);
    });

    it('should produce uppercase hex letters', () => {
      const vo = HexadecimalDecimal.fromDecimal(0xabcdef);

      expect(vo.hex).toBe('ABCDEF');
    });

    it('should not pad hex with leading zeros', () => {
      const vo = HexadecimalDecimal.fromDecimal(1);

      expect(vo.hex).toBe('1');
      expect(vo.hex).not.toBe('00000001');
    });

    it('should accept 0 (boundary minimum)', () => {
      const vo = HexadecimalDecimal.fromDecimal(0);

      expect(vo.decimal).toBe(0);
      expect(vo.hex).toBe('0');
    });

    it('should accept 4294967295 (boundary maximum, 0xFFFFFFFF)', () => {
      const vo = HexadecimalDecimal.fromDecimal(4294967295);

      expect(vo.decimal).toBe(4294967295);
      expect(vo.hex).toBe('FFFFFFFF');
    });

    it.each([-1, -100, 4294967296, 4294967297])(
      'should throw when decimal %s is out of range',
      (value: number) => {
        expect(() => HexadecimalDecimal.fromDecimal(value)).toThrow(DecimalOutOfHexadecimalRangeError);
      },
    );

    it.each([1.5, 0.1, 255.9, NaN, Infinity, -Infinity])(
      'should throw when decimal %s is not a safe integer in range',
      (value: number) => {
        expect(() => HexadecimalDecimal.fromDecimal(value)).toThrow(DecimalOutOfHexadecimalRangeError);
      },
    );

    it('should include correct message on DecimalOutOfHexadecimalRangeError', () => {
      expect(() => HexadecimalDecimal.fromDecimal(-1)).toThrow(
        'Valor decimal fora do intervalo permitido para hexadecimal de até 8 caracteres (0 a 4294967295).',
      );
    });
  });

  describe('fromHex', () => {
    it.each([
      ['0', 0],
      ['1', 1],
      ['A', 10],
      ['a', 10],
      ['F', 15],
      ['10', 16],
      ['FF', 255],
      ['ffff', 65535],
      ['FFFFFF', 16777215],
      ['0x10', 16],
      ['0X10', 16],
      [' 0xAb ', 171],
      ['FFFFFFFF', 4294967295],
      ['ffffffff', 4294967295],
      ['00000001', 1],
      ['00000000', 0],
    ])('should parse hex "%s" as decimal %s', (hex: string, decimal: number) => {
      const vo = HexadecimalDecimal.fromHex(hex);

      expect(vo.decimal).toBe(decimal);
      expect(vo.hex).toBe(decimal.toString(16).toUpperCase());
    });

    it('should always return hex in uppercase', () => {
      const vo = HexadecimalDecimal.fromHex('abcdef12');

      expect(vo.hex).toBe('ABCDEF12');
    });

    it('should accept exactly 8 hex digits (boundary maximum length)', () => {
      const vo = HexadecimalDecimal.fromHex('FFFFFFFF');

      expect(vo.decimal).toBe(4294967295);
    });

    it('should accept exactly 1 hex digit (boundary minimum length)', () => {
      const vo = HexadecimalDecimal.fromHex('0');

      expect(vo.decimal).toBe(0);
    });

    it('should strip leading zeros and keep the parsed value', () => {
      const vo = HexadecimalDecimal.fromHex('000000FF');

      expect(vo.decimal).toBe(255);
      expect(vo.hex).toBe('FF');
    });

    it.each(['', '   ', '0x', '0X'])('should throw when hex is empty after normalization (%s)', (value: string) => {
      expect(() => HexadecimalDecimal.fromHex(value)).toThrow(InvalidHexadecimalStringError);
    });

    it('should throw when hex has exactly 9 digits (above maximum)', () => {
      expect(() => HexadecimalDecimal.fromHex('100000000')).toThrow(InvalidHexadecimalStringError);
    });

    it('should throw when hex with 0x prefix totals more than 8 significant digits', () => {
      expect(() => HexadecimalDecimal.fromHex('0x100000000')).toThrow(InvalidHexadecimalStringError);
    });

    it.each(['GG', 'ZZ', '12-34', '12 34', '0xZZ', '!@#', 'AB.CD', '0x GG'])(
      'should throw when hex contains invalid characters (%s)',
      (value: string) => {
        expect(() => HexadecimalDecimal.fromHex(value)).toThrow(InvalidHexadecimalStringError);
      },
    );

    it('should include correct message on InvalidHexadecimalStringError', () => {
      expect(() => HexadecimalDecimal.fromHex('GG')).toThrow(
        'Valor hexadecimal inválido. Informe de 1 a 8 caracteres usando apenas 0-9 e A-F.',
      );
    });

    it('should be case-insensitive (lowercase and uppercase yield same value)', () => {
      const lower = HexadecimalDecimal.fromHex('abcdef12');
      const upper = HexadecimalDecimal.fromHex('ABCDEF12');

      expect(lower.decimal).toBe(upper.decimal);
    });
  });

  describe('equals', () => {
    it('should return true for same value built from decimal and hex', () => {
      const a = HexadecimalDecimal.fromDecimal(255);
      const b = HexadecimalDecimal.fromHex('FF');

      expect(a.equals(b)).toBe(true);
    });

    it('should return true for same value built from two decimals', () => {
      const a = HexadecimalDecimal.fromDecimal(255);
      const b = HexadecimalDecimal.fromDecimal(255);

      expect(a.equals(b)).toBe(true);
    });

    it('should return true for same value built from two hex strings with different casing', () => {
      const a = HexadecimalDecimal.fromHex('ff');
      const b = HexadecimalDecimal.fromHex('FF');

      expect(a.equals(b)).toBe(true);
    });

    it('should return true for hex with leading zeros matching same decimal', () => {
      const a = HexadecimalDecimal.fromHex('00000001');
      const b = HexadecimalDecimal.fromDecimal(1);

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different values', () => {
      const a = HexadecimalDecimal.fromDecimal(1);
      const b = HexadecimalDecimal.fromDecimal(2);

      expect(a.equals(b)).toBe(false);
    });

    it('should return false for values that differ only in one digit', () => {
      const a = HexadecimalDecimal.fromHex('FF');
      const b = HexadecimalDecimal.fromHex('FE');

      expect(a.equals(b)).toBe(false);
    });

    it('should return true when comparing value with itself', () => {
      const a = HexadecimalDecimal.fromDecimal(42);

      expect(a.equals(a)).toBe(true);
    });
  });

  describe('round-trip consistency', () => {
    it.each([0, 1, 255, 256, 65535, 16777215, 4294967295])(
      'fromDecimal(%s) → hex → fromHex → same decimal',
      (decimal: number) => {
        const original = HexadecimalDecimal.fromDecimal(decimal);
        const roundTripped = HexadecimalDecimal.fromHex(original.hex);

        expect(roundTripped.decimal).toBe(original.decimal);
        expect(roundTripped.hex).toBe(original.hex);
      },
    );

    it.each(['0', 'FF', 'FFFF', 'FFFFFF', 'FFFFFFFF', 'A', '10'])(
      'fromHex("%s") → decimal → fromDecimal → same hex',
      (hex: string) => {
        const original = HexadecimalDecimal.fromHex(hex);
        const roundTripped = HexadecimalDecimal.fromDecimal(original.decimal);

        expect(roundTripped.decimal).toBe(original.decimal);
        expect(roundTripped.hex).toBe(original.hex);
      },
    );
  });
});
