import { VoucherCode } from './voucher-code.vo';

describe('VoucherCode - Unit tests', () => {
  it('should be defined', () => {
    const vo = VoucherCode.fromResaleCode('000HU', 2025);
    expect(vo).toBeDefined();
  });

  describe('parity with the VB.NET legacy', () => {
    it('should encode "000HU2025" → "CAPUYMOMTZTQ"', () => {
      expect(VoucherCode.fromResaleCode('000HU', 2025).value).toBe('CAPUYMOMTZTQ');
    });

    it('should encode "000HV2025" → "CAPUYMUTZQ2G"', () => {
      expect(VoucherCode.fromResaleCode('000HV', 2025).value).toBe('CAPUYMUTZQ2G');
    });

    it('should encode "000B92025" → "CAPUVJM67NIX"', () => {
      expect(VoucherCode.fromResaleCode('000B9', 2025).value).toBe('CAPUVJM67NIX');
    });

    it('should encode "000012025" → "CAPUMKZCTT5A"', () => {
      expect(VoucherCode.fromResaleCode('00001', 2025).value).toBe('CAPUMKZCTT5A');
    });

    it('should return empty string when identifier is empty', () => {
      expect(VoucherCode.fromResaleCode('', 2025).value).toBe('');
    });
  });

  describe('fromResaleCode', () => {
    it('should return empty string when identifier is only whitespace', () => {
      expect(VoucherCode.fromResaleCode('   ', 2025).value).toBe('');
    });

    it('should produce different codes for different identifiers', () => {
      const a = VoucherCode.fromResaleCode('000HU', 2025).value;
      const b = VoucherCode.fromResaleCode('000HV', 2025).value;
      expect(a).not.toBe(b);
    });

    it('should produce different codes for the same identifier in different years', () => {
      const a = VoucherCode.fromResaleCode('000HU', 2025).value;
      const b = VoucherCode.fromResaleCode('000HU', 2026).value;
      expect(a).not.toBe(b);
    });

    it('should produce the same code when called twice with same args (deterministic)', () => {
      const a = VoucherCode.fromResaleCode('000HU', 2025).value;
      const b = VoucherCode.fromResaleCode('000HU', 2025).value;
      expect(a).toBe(b);
    });
  });
});
