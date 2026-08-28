import { AppException } from 'src/core/filters/app.exception';
import { InvalidDayError } from 'src/shared/value-objects/day/day.error';
import { InvalidMonthError } from 'src/shared/value-objects/month/month.error';
import { NumberMustBePositiveAndInt } from 'src/shared/value-objects/positive-int/positive-int.error';
import { ClientInvoiceConfigDueDateType } from '../../enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from '../../enums/client-invoice-config-type.enum';
import {
  InvoiceCalendarDeadlineDaysMissingError,
  InvoiceCalendarDueDateDayMissingError,
  InvoiceCalendarDueMonthMissingError,
  InvoiceCalendarInvalidCompetenceError,
} from './invoice-calendar-due-date.error';
import {
  InvoiceCalendarDueDate,
  type InvoiceCalendarDueDateProps,
} from './invoice-calendar-due-date.vo';

function makeValidProps(overrides: Partial<InvoiceCalendarDueDateProps> = {}): InvoiceCalendarDueDateProps {
  return {
    invoiceType: ClientInvoiceConfigType.MONTHLY,
    dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
    dueDateDay: 15,
    dueMonth: null,
    deadlineDays: null,
    referenceYear: 2026,
    referenceMonth: 8,
    issuedAt: new Date('2026-08-20T15:00:00-03:00'),
    ...overrides,
  };
}

describe('InvoiceCalendarDueDate - Unit tests', () => {
  let sut: InvoiceCalendarDueDate;

  beforeEach(() => {
    sut = new InvoiceCalendarDueDate(makeValidProps());
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('DUE_DATE monthly', () => {
    it('should resolve using reference month/year', () => {
      // Arrange
      const props = makeValidProps({
        dueDateDay: 15,
        referenceMonth: 8,
        referenceYear: 2026,
      });

      // Act
      const result = new InvoiceCalendarDueDate(props);

      // Assert
      expect(result.value).toBe('2026-08-15');
    });

    it('should clamp day to last day of month', () => {
      // Arrange
      const props = makeValidProps({
        dueDateDay: 31,
        referenceMonth: 2,
        referenceYear: 2026,
      });

      // Act
      const result = new InvoiceCalendarDueDate(props);

      // Assert
      expect(result.value).toBe('2026-02-28');
    });

    it('should ignore dueMonth and use referenceMonth', () => {
      // Arrange
      const props = makeValidProps({
        dueDateDay: 15,
        dueMonth: 12,
        referenceMonth: 8,
        referenceYear: 2026,
      });

      // Act
      const result = new InvoiceCalendarDueDate(props);

      // Assert
      expect(result.value).toBe('2026-08-15');
    });

    it('should clamp day to last day of leap-year February', () => {
      // Arrange
      const props = makeValidProps({
        dueDateDay: 31,
        referenceMonth: 2,
        referenceYear: 2024,
      });

      // Act
      const result = new InvoiceCalendarDueDate(props);

      // Assert
      expect(result.value).toBe('2024-02-29');
    });

    it('should throw InvalidMonthError when referenceMonth is out of range', () => {
      // Arrange
      const props = makeValidProps({
        referenceMonth: 13,
      });

      // Act & Assert
      expect(() => new InvoiceCalendarDueDate(props)).toThrow(InvalidMonthError);
    });
  });

  describe('DUE_DATE annual', () => {
    it('should resolve using dueMonth and referenceYear', () => {
      // Arrange
      const props = makeValidProps({
        invoiceType: ClientInvoiceConfigType.ANNUAL,
        dueDateDay: 10,
        dueMonth: 12,
        referenceMonth: 8,
        referenceYear: 2026,
      });

      // Act
      const result = new InvoiceCalendarDueDate(props);

      // Assert
      expect(result.value).toBe('2026-12-10');
    });

    it('should throw when dueMonth is missing', () => {
      // Arrange
      const props = makeValidProps({
        invoiceType: ClientInvoiceConfigType.ANNUAL,
        dueDateDay: 10,
        dueMonth: null,
      });

      // Act & Assert
      expect(() => new InvoiceCalendarDueDate(props)).toThrow(InvoiceCalendarDueMonthMissingError);
      expect(() => new InvoiceCalendarDueDate(props)).toThrow('Mês de vencimento ausente.');
    });

    it('should throw InvalidMonthError when dueMonth is out of range', () => {
      // Arrange
      const props = makeValidProps({
        invoiceType: ClientInvoiceConfigType.ANNUAL,
        dueDateDay: 10,
        dueMonth: 13,
      });

      // Act & Assert
      expect(() => new InvoiceCalendarDueDate(props)).toThrow(InvalidMonthError);
    });
  });

  describe('DEADLINE', () => {
    it('should resolve from issuedAt plus deadlineDays', () => {
      // Arrange
      const props = makeValidProps({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 5,
        issuedAt: new Date('2026-08-20T15:00:00-03:00'),
      });

      // Act
      const result = new InvoiceCalendarDueDate(props);

      // Assert
      expect(result.value).toBe('2026-08-25');
    });

    it('should accept deadlineDays zero', () => {
      // Arrange
      const props = makeValidProps({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 0,
        issuedAt: new Date('2026-08-20T15:00:00-03:00'),
      });

      // Act
      const result = new InvoiceCalendarDueDate(props);

      // Assert
      expect(result.value).toBe('2026-08-20');
    });

    it('should resolve DEADLINE using America/Sao_Paulo calendar day from UTC issuedAt', () => {
      // Arrange — 2026-08-21T02:00:00.000Z = 2026-08-20 23:00 America/Sao_Paulo
      const props = makeValidProps({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 0,
        issuedAt: new Date('2026-08-21T02:00:00.000Z'),
      });

      // Act
      const result = new InvoiceCalendarDueDate(props);

      // Assert
      expect(result.value).toBe('2026-08-20');
    });

    it('should throw when deadlineDays is missing', () => {
      // Arrange
      const props = makeValidProps({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: null,
      });

      // Act & Assert
      expect(() => new InvoiceCalendarDueDate(props)).toThrow(InvoiceCalendarDeadlineDaysMissingError);
      expect(() => new InvoiceCalendarDueDate(props)).toThrow('Prazo de faturamento inválido.');
    });

    it('should throw when deadlineDays is negative', () => {
      // Arrange
      const props = makeValidProps({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: -1,
      });

      // Act & Assert
      expect(() => new InvoiceCalendarDueDate(props)).toThrow(NumberMustBePositiveAndInt);
    });
  });

  describe('validation errors', () => {
    it('should throw when dueDateDay is missing for DUE_DATE', () => {
      // Arrange
      const props = makeValidProps({ dueDateDay: null });

      // Act & Assert
      expect(() => new InvoiceCalendarDueDate(props)).toThrow(InvoiceCalendarDueDateDayMissingError);
      expect(() => new InvoiceCalendarDueDate(props)).toThrow('Dia de vencimento ausente.');
    });

    it('should throw InvalidDayError when dueDateDay is out of range', () => {
      // Arrange
      const props = makeValidProps({ dueDateDay: 32 });

      // Act & Assert
      expect(() => new InvoiceCalendarDueDate(props)).toThrow(InvalidDayError);
    });

    it('should throw AppException when dueDateType is invalid', () => {
      // Arrange
      const props = makeValidProps({ dueDateType: 'invalid' });

      // Act & Assert
      expect(() => new InvoiceCalendarDueDate(props)).toThrow(AppException);
    });

    it('should throw AppException when invoiceType is invalid', () => {
      // Arrange
      const props = makeValidProps({ invoiceType: 'invalid' });

      // Act & Assert
      expect(() => new InvoiceCalendarDueDate(props)).toThrow(AppException);
    });

    it('should throw InvoiceCalendarInvalidCompetenceError when competence is invalid', () => {
      // Arrange
      const props = makeValidProps({
        referenceYear: Number.NaN,
        referenceMonth: 8,
      });

      // Act & Assert
      expect(() => new InvoiceCalendarDueDate(props)).toThrow(InvoiceCalendarInvalidCompetenceError);
      expect(() => new InvoiceCalendarDueDate(props)).toThrow('Competência inválida.');
    });

    it('should throw InvoiceCalendarInvalidCompetenceError when referenceYear is less than 1', () => {
      // Arrange
      const props = makeValidProps({
        referenceYear: 0,
        referenceMonth: 8,
      });

      // Act & Assert
      expect(() => new InvoiceCalendarDueDate(props)).toThrow(InvoiceCalendarInvalidCompetenceError);
      expect(() => new InvoiceCalendarDueDate(props)).toThrow('Competência inválida.');
    });
  });
});
