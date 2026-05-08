import { InvalidMonthError } from './month.error';
import { Month } from './month.vo';

describe('Month Value Object', () => {
  describe('valid values', () => {
    it.each([1, 6, 12, 2, 11])(
      'should create Month when value is valid integer in range (%s)',
      (value: number) => {
        // Arrange
        // Act
        const sut = new Month(value);

        // Assert
        expect(sut).toBeInstanceOf(Month);
        expect(sut.value).toBe(value);
      },
    );

    it('should expose boundary MIN_MONTH', () => {
      // Arrange
      // Act
      const sut = new Month(Month.MIN_MONTH);

      // Assert
      expect(sut.value).toBe(1);
    });

    it('should expose boundary MAX_MONTH', () => {
      // Arrange
      // Act
      const sut = new Month(Month.MAX_MONTH);

      // Assert
      expect(sut.value).toBe(12);
    });
  });

  describe('invalid values - out of range', () => {
    it.each([0, -1, -10])(
      'should throw InvalidMonthError when value is less than 1 (%s)',
      (value: number) => {
        // Arrange
        // Act
        // Assert
        expect(() => new Month(value)).toThrow(InvalidMonthError);
        expect(() => new Month(value)).toThrow('Mês deve ser entre 1 e 12.');
      },
    );

    it.each([13, 14, 100])(
      'should throw InvalidMonthError when value is greater than 12 (%s)',
      (value: number) => {
        // Arrange
        // Act
        // Assert
        expect(() => new Month(value)).toThrow(InvalidMonthError);
        expect(() => new Month(value)).toThrow('Mês deve ser entre 1 e 12.');
      },
    );
  });

  describe('invalid values - not integer', () => {
    it.each([1.5, 6.5, 11.9, -12.3, 0.01, 0.99])(
      'should throw InvalidMonthError when value is not an integer (%s)',
      (value: number) => {
        // Arrange
        // Act
        // Assert
        expect(() => new Month(value)).toThrow(InvalidMonthError);
      },
    );

    it('should throw InvalidMonthError when value is NaN', () => {
      // Arrange
      // Act
      // Assert
      expect(() => new Month(NaN)).toThrow(InvalidMonthError);
    });

    it('should throw InvalidMonthError when value is Infinity', () => {
      // Arrange
      // Act
      // Assert
      expect(() => new Month(Infinity)).toThrow(InvalidMonthError);
    });

    it('should throw InvalidMonthError when value is -Infinity', () => {
      // Arrange
      // Act
      // Assert
      expect(() => new Month(-Infinity)).toThrow(InvalidMonthError);
    });
  });
});
