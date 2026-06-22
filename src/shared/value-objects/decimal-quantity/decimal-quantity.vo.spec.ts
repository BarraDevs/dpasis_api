import { DecimalQuantity } from './decimal-quantity.vo';

describe('DecimalQuantity - Unit tests', () => {
  it('should be defined', () => {
    expect(DecimalQuantity).toBeDefined();
  });

  describe('fromDecimal', () => {
    it.each([
      [0, 4, '0.0000'],
      [1, 4, '1.0000'],
      [1.5, 4, '1.5000'],
      [0.1234, 4, '0.1234'],
      [10.9876, 4, '10.9876'],
      [99999.9999, 4, '99999.9999'],
    ])('should format %f with %i decimals as %s', (value, decimals, expected) => {
      // Act
      const result = DecimalQuantity.fromDecimal(value, decimals);

      // Assert
      expect(result).toBeInstanceOf(DecimalQuantity);
      expect(result.value).toBe(expected);
    });

    it('should use 4 decimals by default', () => {
      // Act
      const result = DecimalQuantity.fromDecimal(1);

      // Assert
      expect(result.value).toBe('1.0000');
    });

    it('should round when value exceeds decimal precision', () => {
      // Act
      const result = DecimalQuantity.fromDecimal(1.23456);

      // Assert
      expect(result.value).toBe('1.2346');
    });

    it('should format with custom decimals', () => {
      // Act
      const result = DecimalQuantity.fromDecimal(3.14, 2);

      // Assert
      expect(result.value).toBe('3.14');
    });

    it('should format negative quantities', () => {
      // Act
      const result = DecimalQuantity.fromDecimal(-2.5);

      // Assert
      expect(result.value).toBe('-2.5000');
    });

    it('should format zero decimals when requested', () => {
      // Act
      const result = DecimalQuantity.fromDecimal(7.8, 0);

      // Assert
      expect(result.value).toBe('8');
    });
  });
});
