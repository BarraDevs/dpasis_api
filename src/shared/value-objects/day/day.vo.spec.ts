import { InvalidDayError } from './day.error';
import { Day } from './day.vo';

describe('Day Value Object', () => {
  describe('valid values', () => {
    it.each([1, 15, 31, 2, 30])(
      'should create Day when value is valid integer in range (%s)',
      (value: number) => {
        // Arrange
        // Act
        const sut = new Day(value);

        // Assert
        expect(sut).toBeInstanceOf(Day);
        expect(sut.value).toBe(value);
      },
    );

    it('should expose boundary MIN_DAY', () => {
      // Arrange
      // Act
      const sut = new Day(Day.MIN_DAY);

      // Assert
      expect(sut.value).toBe(1);
    });

    it('should expose boundary MAX_DAY', () => {
      // Arrange
      // Act
      const sut = new Day(Day.MAX_DAY);

      // Assert
      expect(sut.value).toBe(31);
    });
  });

  describe('invalid values - out of range', () => {
    it.each([0, -1, -10])(
      'should throw InvalidDayError when value is less than 1 (%s)',
      (value: number) => {
        // Arrange
        // Act
        // Assert
        expect(() => new Day(value)).toThrow(InvalidDayError);
        expect(() => new Day(value)).toThrow('Dia deve ser entre 1 e 31.');
      },
    );

    it.each([32, 33, 100])(
      'should throw InvalidDayError when value is greater than 31 (%s)',
      (value: number) => {
        // Arrange
        // Act
        // Assert
        expect(() => new Day(value)).toThrow(InvalidDayError);
        expect(() => new Day(value)).toThrow('Dia deve ser entre 1 e 31.');
      },
    );
  });

  describe('invalid values - not integer', () => {
    it.each([1.5, 15.5, 30.9, -12.3, 0.01, 0.99])(
      'should throw InvalidDayError when value is not an integer (%s)',
      (value: number) => {
        // Arrange
        // Act
        // Assert
        expect(() => new Day(value)).toThrow(InvalidDayError);
      },
    );

    it('should throw InvalidDayError when value is NaN', () => {
      // Arrange
      // Act
      // Assert
      expect(() => new Day(NaN)).toThrow(InvalidDayError);
    });

    it('should throw InvalidDayError when value is Infinity', () => {
      // Arrange
      // Act
      // Assert
      expect(() => new Day(Infinity)).toThrow(InvalidDayError);
    });

    it('should throw InvalidDayError when value is -Infinity', () => {
      // Arrange
      // Act
      // Assert
      expect(() => new Day(-Infinity)).toThrow(InvalidDayError);
    });
  });
});
