import { InvalidDayError } from 'src/shared/value-objects/day/day.error';
import { InvalidMonthError } from 'src/shared/value-objects/month/month.error';
import {
  DueDateIsLessThanEmissionDayError,
  DueDateIsLessThanMinimumIntervalBetweenEmissionDayAndDueDateDayError,
} from './invoice-due-date.error';
import { InvoiceDueDate, type InvoiceDueDateProps } from './invoice-due-date.vo';

function makeValidInvoiceDueDateProps(
  overrides: Partial<InvoiceDueDateProps> = {},
): InvoiceDueDateProps {
  return {
    emissionDay: 1,
    dueDateDay: 16,
    dueMonth: 6,
    ...overrides,
  };
}

describe('InvoiceDueDate - Unit tests', () => {
  let sut: InvoiceDueDate;

  beforeEach(() => {
    sut = new InvoiceDueDate(makeValidInvoiceDueDateProps());
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it.each([
    { emissionDay: 1, dueDateDay: 16, dueMonth: 1 },
    { emissionDay: 5, dueDateDay: 20, dueMonth: 12 },
    { emissionDay: 16, dueDateDay: 31, dueMonth: 3 },
  ])(
    'should create when due date is strictly after emission and interval is at least 15 days',
    ({ emissionDay, dueDateDay, dueMonth }: InvoiceDueDateProps) => {
      // Arrange
      const props = makeValidInvoiceDueDateProps({ emissionDay, dueDateDay, dueMonth });

      // Act
      const instance = new InvoiceDueDate(props);

      // Assert
      expect(instance).toBeInstanceOf(InvoiceDueDate);
      expect(instance.value).toEqual({ emissionDay, dueDateDay, dueMonth });
    },
  );

  it('should accept boundary when dueDateDay minus emissionDay equals exactly 15', () => {
    // Arrange
    const props = makeValidInvoiceDueDateProps({ emissionDay: 10, dueDateDay: 25, dueMonth: 2 });

    // Act
    const instance = new InvoiceDueDate(props);

    // Assert
    expect(instance.value).toEqual({ emissionDay: 10, dueDateDay: 25, dueMonth: 2 });
  });

  it('should return a copy of value so external mutation does not affect subsequent reads', () => {
    // Arrange
    const first = sut.value;
    first.emissionDay = 99;
    first.dueDateDay = 99;
    first.dueMonth = 99;

    // Act
    const second = sut.value;

    // Assert
    expect(second).toEqual(makeValidInvoiceDueDateProps());
  });

  describe('DueDateIsLessThanEmissionDayError', () => {
    it.each([
      { emissionDay: 10, dueDateDay: 10 },
      { emissionDay: 20, dueDateDay: 5 },
    ])(
      'should throw when dueDateDay is less than or equal to emissionDay (%o)',
      ({ emissionDay, dueDateDay }: Pick<InvoiceDueDateProps, 'emissionDay' | 'dueDateDay'>) => {
        // Arrange
        const props = makeValidInvoiceDueDateProps({ emissionDay, dueDateDay });

        // Act
        // Assert
        expect(() => new InvoiceDueDate(props)).toThrow(DueDateIsLessThanEmissionDayError);
        expect(() => new InvoiceDueDate(props)).toThrow(
          'Data de vencimento deve ser maior que a data de emissão.',
        );
      },
    );
  });

  describe('DueDateIsLessThanMinimumIntervalBetweenEmissionDayAndDueDateDayError', () => {
    it.each([
      { emissionDay: 1, dueDateDay: 15 },
      { emissionDay: 1, dueDateDay: 2 },
      { emissionDay: 16, dueDateDay: 30 },
    ])(
      'should throw when interval between dueDateDay and emissionDay is less than 15 (%o)',
      ({ emissionDay, dueDateDay }: Pick<InvoiceDueDateProps, 'emissionDay' | 'dueDateDay'>) => {
        // Arrange
        const props = makeValidInvoiceDueDateProps({ emissionDay, dueDateDay });

        // Act
        // Assert
        expect(() => new InvoiceDueDate(props)).toThrow(
          DueDateIsLessThanMinimumIntervalBetweenEmissionDayAndDueDateDayError,
        );
        expect(() => new InvoiceDueDate(props)).toThrow(
          'Data de vencimento deve ser maior que 15 dias após a data de emissão.',
        );
      },
    );
  });

  describe('invalid emissionDay (Day)', () => {
    it('should throw InvalidDayError when emissionDay is out of range', () => {
      // Arrange
      const props = makeValidInvoiceDueDateProps({ emissionDay: 0 });

      // Act
      // Assert
      expect(() => new InvoiceDueDate(props)).toThrow(InvalidDayError);
    });
  });

  describe('invalid dueDateDay (Day)', () => {
    it('should throw InvalidDayError when dueDateDay is out of range', () => {
      // Arrange
      const props = makeValidInvoiceDueDateProps({ dueDateDay: 32 });

      // Act
      // Assert
      expect(() => new InvoiceDueDate(props)).toThrow(InvalidDayError);
    });
  });

  describe('invalid dueMonth (Month)', () => {
    it('should throw InvalidMonthError when dueMonth is out of range', () => {
      // Arrange
      const props = makeValidInvoiceDueDateProps({ dueMonth: 13 });

      // Act
      // Assert
      expect(() => new InvoiceDueDate(props)).toThrow(InvalidMonthError);
    });
  });
});
