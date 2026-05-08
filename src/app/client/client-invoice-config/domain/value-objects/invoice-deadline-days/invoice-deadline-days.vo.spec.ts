import { InvalidDayError } from 'src/shared/value-objects/day/day.error';
import { NumberMustBePositiveAndInt } from 'src/shared/value-objects/positive-int/positive-int.error';
import {
  InvoiceDeadlineDays,
  type InvoiceDeadlineDaysProps,
} from './invoice-deadline-days.vo';

function makeValidInvoiceDeadlineDaysProps(
  overrides: Partial<InvoiceDeadlineDaysProps> = {},
): InvoiceDeadlineDaysProps {
  return {
    emissionDay: 10,
    deadlineDays: 20,
    ...overrides,
  };
}

describe('InvoiceDeadlineDays - Unit tests', () => {
  let sut: InvoiceDeadlineDays;

  beforeEach(() => {
    sut = new InvoiceDeadlineDays(makeValidInvoiceDeadlineDaysProps());
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it.each([
    [1, 1],
    [15, 100],
    [31, 2],
  ])(
    'should create when emissionDay and deadlineDays are valid (%s, %s)',
    (emissionDay: number, deadlineDays: number) => {
      // Arrange
      const props = makeValidInvoiceDeadlineDaysProps({ emissionDay, deadlineDays });

      // Act
      const instance = new InvoiceDeadlineDays(props);

      // Assert
      expect(instance).toBeInstanceOf(InvoiceDeadlineDays);
      expect(instance.value).toEqual({ emissionDay, deadlineDays });
    },
  );

  it('should return a copy of value so external mutation does not affect subsequent reads', () => {
    // Arrange
    const first = sut.value;
    first.emissionDay = 99;
    first.deadlineDays = 99;

    // Act
    const second = sut.value;

    // Assert
    expect(second).toEqual(makeValidInvoiceDeadlineDaysProps());
  });

  describe('invalid emissionDay (Day)', () => {
    it.each([0, 32, 1.5])(
      'should throw InvalidDayError when emissionDay is invalid (%s)',
      (emissionDay: number) => {
        // Arrange
        const props = makeValidInvoiceDeadlineDaysProps({ emissionDay });

        // Act
        // Assert
        expect(() => new InvoiceDeadlineDays(props)).toThrow(InvalidDayError);
      },
    );
  });

  describe('invalid deadlineDays (PositiveInt)', () => {
    it.each([0, -1, 1.5])(
      'should throw NumberMustBePositiveAndInt when deadlineDays is invalid (%s)',
      (deadlineDays: number) => {
        // Arrange
        const props = makeValidInvoiceDeadlineDaysProps({ deadlineDays });

        // Act
        // Assert
        expect(() => new InvoiceDeadlineDays(props)).toThrow(NumberMustBePositiveAndInt);
        expect(() => new InvoiceDeadlineDays(props)).toThrow(
          'O campo deadlineDays deve ser um número inteiro positivo',
        );
      },
    );
  });
});
