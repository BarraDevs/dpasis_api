import { DecimalMoney } from './decimal-money.vo';

describe('DecimalMoney - Unit tests', () => {
  it('should be defined', () => {
    expect(DecimalMoney).toBeDefined();
  });

  describe('fromCents', () => {
    it.each([
      [0, 2, '0.00'],
      [1, 2, '0.01'],
      [99, 2, '0.99'],
      [100, 2, '1.00'],
      [150, 2, '1.50'],
      [999999999, 2, '9999999.99'],
    ])('should format %i cents with %i decimals as %s', (cents, decimals, expected) => {
      // Act
      const result = DecimalMoney.fromCents(cents, decimals);

      // Assert
      expect(result).toBeInstanceOf(DecimalMoney);
      expect(result.value).toBe(expected);
    });

    it('should use 2 decimals by default', () => {
      // Act
      const result = DecimalMoney.fromCents(100);

      // Assert
      expect(result.value).toBe('1.00');
    });

    it('should format cents with custom decimals', () => {
      // Act
      const result = DecimalMoney.fromCents(100, 10);

      // Assert
      expect(result.value).toBe('1.0000000000');
    });

    it('should format negative cents', () => {
      // Act
      const result = DecimalMoney.fromCents(-150);

      // Assert
      expect(result.value).toBe('-1.50');
    });
  });

  describe('fromDecimal', () => {
    it.each([
      [0, 2, '0.00'],
      [1.5, 2, '1.50'],
      [10.99, 2, '10.99'],
      [0.1, 2, '0.10'],
    ])('should format %f with %i decimals as %s', (value, decimals, expected) => {
      // Act
      const result = DecimalMoney.fromDecimal(value, decimals);

      // Assert
      expect(result).toBeInstanceOf(DecimalMoney);
      expect(result.value).toBe(expected);
    });

    it('should use 2 decimals by default', () => {
      // Act
      const result = DecimalMoney.fromDecimal(1.5);

      // Assert
      expect(result.value).toBe('1.50');
    });

    it('should round when value exceeds decimal precision', () => {
      // Act
      const result = DecimalMoney.fromDecimal(1.236, 2);

      // Assert
      expect(result.value).toBe('1.24');
    });

    it('should format with 10 decimals for NF unit values', () => {
      // Act
      const result = DecimalMoney.fromDecimal(12.3456789012, 10);

      // Assert
      expect(result.value).toBe('12.3456789012');
    });

    it('should format negative decimal values', () => {
      // Act
      const result = DecimalMoney.fromDecimal(-3.4);

      // Assert
      expect(result.value).toBe('-3.40');
    });

    it('should format product value from quantity and unit cents', () => {
      // Arrange
      const quantity = 2.5;
      const unitValueInCents = 400;

      // Act
      const result = DecimalMoney.fromDecimal((quantity * unitValueInCents) / 100);

      // Assert
      expect(result.value).toBe('10.00');
    });
  });
});
