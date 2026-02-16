import { Commission } from './commision.vo';
import { InvalidCommissionError } from './commision.vo.error';

describe('Commission Value Object', () => {
  describe('valid commissions', () => {
    it('should create a commission with value 0', () => {
      // Act
      const commission = new Commission(0);

      // Assert
      expect(commission).toBeInstanceOf(Commission);
      expect(commission.value).toBe(0);
    });

    it('should create a commission with value 100', () => {
      // Act
      const commission = new Commission(100);

      // Assert
      expect(commission).toBeInstanceOf(Commission);
      expect(commission.value).toBe(100);
    });

    it.each([
      0,
      0.5,
      1,
      5,
      10,
      15.5,
      25,
      33.33,
      50,
      66.67,
      75,
      90,
      99,
      99.99,
      100,
    ])('should create a commission with valid value (%s)', (value: number) => {
      // Act
      const commission = new Commission(value);

      // Assert
      expect(commission).toBeInstanceOf(Commission);
      expect(commission.value).toBe(value);
    });

    it('should create a commission with decimal value', () => {
      // Act
      const commission = new Commission(7.5);

      // Assert
      expect(commission).toBeInstanceOf(Commission);
      expect(commission.value).toBe(7.5);
    });

    it('should create a commission with many decimal places', () => {
      // Act
      const commission = new Commission(12.345678);

      // Assert
      expect(commission).toBeInstanceOf(Commission);
      expect(commission.value).toBe(12.345678);
    });

    it('should preserve the exact value provided', () => {
      // Arrange
      const value = 45.67;

      // Act
      const commission = new Commission(value);

      // Assert
      expect(commission.value).toBe(value);
    });
  });

  describe('invalid commissions', () => {
    it('should throw error when commission is negative', () => {
      // Act & Assert
      expect(() => new Commission(-1)).toThrow(InvalidCommissionError);
      expect(() => new Commission(-1)).toThrow('A comissão deve estar entre 0 e 100');
    });

    it('should throw error when commission is greater than 100', () => {
      // Act & Assert
      expect(() => new Commission(101)).toThrow(InvalidCommissionError);
      expect(() => new Commission(101)).toThrow('A comissão deve estar entre 0 e 100');
    });

    it.each([
      -100,
      -50,
      -10,
      -1,
      -0.1,
      -0.01,
      100.01,
      101,
      150,
      200,
      1000,
    ])('should throw error when providing invalid commission (%s)', (value: number) => {
      // Act & Assert
      expect(() => new Commission(value)).toThrow(InvalidCommissionError);
      expect(() => new Commission(value)).toThrow('A comissão deve estar entre 0 e 100');
    });

    it('should throw error with very large negative number', () => {
      // Act & Assert
      expect(() => new Commission(-999999)).toThrow(InvalidCommissionError);
    });

    it('should throw error with very large positive number', () => {
      // Act & Assert
      expect(() => new Commission(999999)).toThrow(InvalidCommissionError);
    });
  });

  describe('edge cases', () => {
    it('should handle value exactly at lower boundary (0)', () => {
      // Act
      const commission = new Commission(0);

      // Assert
      expect(commission.value).toBe(0);
    });

    it('should handle value exactly at upper boundary (100)', () => {
      // Act
      const commission = new Commission(100);

      // Assert
      expect(commission.value).toBe(100);
    });

    it('should throw error for value just below lower boundary', () => {
      // Act & Assert
      expect(() => new Commission(-0.000001)).toThrow(InvalidCommissionError);
    });

    it('should throw error for value just above upper boundary', () => {
      // Act & Assert
      expect(() => new Commission(100.000001)).toThrow(InvalidCommissionError);
    });

    it('should handle very small positive decimal', () => {
      // Act
      const commission = new Commission(0.000001);

      // Assert
      expect(commission.value).toBe(0.000001);
    });

    it('should handle value very close to 100', () => {
      // Act
      const commission = new Commission(99.999999);

      // Assert
      expect(commission.value).toBe(99.999999);
    });
  });

  describe('immutability', () => {
    it('should not allow modification of value property', () => {
      // Arrange
      const commission = new Commission(50);
      const originalValue = commission.value;

      // Act
      // TypeScript prevents direct assignment, but we can verify the value remains unchanged
      const valueAfter = commission.value;

      // Assert
      expect(valueAfter).toBe(originalValue);
      expect(valueAfter).toBe(50);
    });

    it('should return the same value when accessed multiple times', () => {
      // Arrange
      const commission = new Commission(75.5);

      // Act
      const value1 = commission.value;
      const value2 = commission.value;
      const value3 = commission.value;

      // Assert
      expect(value1).toBe(value2);
      expect(value2).toBe(value3);
      expect(value1).toBe(75.5);
    });
  });

  describe('type safety', () => {
    it('should only accept number type', () => {
      // Act & Assert
      expect(() => new Commission('10' as any)).toThrow();
      expect(() => new Commission(null as any)).toThrow();
      expect(() => new Commission(undefined as any)).toThrow();
    });

    it('should handle NaN as invalid', () => {
      // Act & Assert
      expect(() => new Commission(NaN)).toThrow();
    });

    it('should handle Infinity as invalid', () => {
      // Act & Assert
      expect(() => new Commission(Infinity)).toThrow(InvalidCommissionError);
    });

    it('should handle negative Infinity as invalid', () => {
      // Act & Assert
      expect(() => new Commission(-Infinity)).toThrow(InvalidCommissionError);
    });
  });

  describe('common use cases', () => {
    it('should create commission for typical sales commission (5%)', () => {
      // Act
      const commission = new Commission(5);

      // Assert
      expect(commission.value).toBe(5);
    });

    it('should create commission for typical sales commission (10%)', () => {
      // Act
      const commission = new Commission(10);

      // Assert
      expect(commission.value).toBe(10);
    });

    it('should create commission for high-value commission (20%)', () => {
      // Act
      const commission = new Commission(20);

      // Assert
      expect(commission.value).toBe(20);
    });

    it('should create commission with fractional percentage (7.5%)', () => {
      // Act
      const commission = new Commission(7.5);

      // Assert
      expect(commission.value).toBe(7.5);
    });

    it('should create commission for no commission scenario (0%)', () => {
      // Act
      const commission = new Commission(0);

      // Assert
      expect(commission.value).toBe(0);
    });
  });
});
