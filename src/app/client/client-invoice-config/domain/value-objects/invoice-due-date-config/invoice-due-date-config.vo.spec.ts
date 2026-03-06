import { AppException } from 'src/core/filters/app.exception';
import { InvalidDueDateDayError } from 'src/shared/value-objects/due-date-day/due-date-day.error';
import { InvalidEmissionDayError } from 'src/shared/value-objects/emission-day/emission-day.error';
import { NumberMustBePositiveAndInt } from 'src/shared/value-objects/positive-int/positive-int.error';
import { ClientInvoiceConfigDueDateType } from '../../enums/client-invoice-config-due-date-type.enum';
import { DeadlineDaysRequiredError } from './invoice-due-date-config.error';
import { InvoiceDueDateConfig } from './invoice-due-date-config.vo';

describe('InvoiceDueDateConfig Value Object', () => {
  describe('DUE_DATE type', () => {
    it('should create with valid dueDateDay', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 15,
        deadlineDays: null,
        emissionDay: 5,
      });

      expect(config.value.dueDateType).toBe(ClientInvoiceConfigDueDateType.DUE_DATE);
      expect(config.value.dueDateDay).toBe(15);
      expect(config.value.deadlineDays).toBeNull();
      expect(config.isDueDateType()).toBe(true);
      expect(config.isDeadlineType()).toBe(false);
    });

    it('should throw InvalidDueDateDayError when dueDateDay is null', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: null,
          deadlineDays: null,
          emissionDay: 5,
        }),
      ).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidDueDateDayError when dueDateDay is less than emissionDay', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 5,
          deadlineDays: null,
          emissionDay: 10,
        }),
      ).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidDueDateDayError when dueDateDay equals emissionDay', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 15,
          deadlineDays: null,
          emissionDay: 15,
        }),
      ).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidDueDateDayError when dueDateDay is 0', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 0,
          deadlineDays: null,
          emissionDay: 1,
        }),
      ).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidDueDateDayError when dueDateDay is 32', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 32,
          deadlineDays: null,
          emissionDay: 1,
        }),
      ).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidDueDateDayError when dueDateDay is decimal', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 15.5,
          deadlineDays: null,
          emissionDay: 5,
        }),
      ).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidDueDateDayError when dueDateDay is undefined', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: undefined as unknown as number | null,
          deadlineDays: null,
          emissionDay: 5,
        }),
      ).toThrow(InvalidDueDateDayError);
    });

    it('should accept dueDateDay 31 when emissionDay is 30', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 31,
        deadlineDays: null,
        emissionDay: 30,
      });

      expect(config.value.dueDateDay).toBe(31);
    });

    it('should accept dueDateDay 2 when emissionDay is 1', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 2,
        deadlineDays: null,
        emissionDay: 1,
      });

      expect(config.value.dueDateDay).toBe(2);
    });

    it('should ignore deadlineDays and set to null when DUE_DATE', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 20,
        deadlineDays: 99,
        emissionDay: 5,
      });

      expect(config.value.deadlineDays).toBeNull();
      expect(config.value.dueDateDay).toBe(20);
    });

    it('should throw InvalidEmissionDayError when emissionDay is 0', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 15,
          deadlineDays: null,
          emissionDay: 0,
        }),
      ).toThrow(InvalidEmissionDayError);
    });

    it('should throw InvalidEmissionDayError when emissionDay is 32', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 15,
          deadlineDays: null,
          emissionDay: 32,
        }),
      ).toThrow(InvalidEmissionDayError);
    });

    it('should throw InvalidEmissionDayError when emissionDay is decimal', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 15,
          deadlineDays: null,
          emissionDay: 5.5,
        }),
      ).toThrow(InvalidEmissionDayError);
    });
  });

  describe('DEADLINE type', () => {
    it('should create with valid deadlineDays', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 10,
        emissionDay: 5,
      });

      expect(config.value.dueDateType).toBe(ClientInvoiceConfigDueDateType.DEADLINE);
      expect(config.value.dueDateDay).toBeNull();
      expect(config.value.deadlineDays).toBe(10);
      expect(config.isDueDateType()).toBe(false);
      expect(config.isDeadlineType()).toBe(true);
    });

    it('should throw DeadlineDaysRequiredError when deadlineDays is null', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
          dueDateDay: null,
          deadlineDays: null,
          emissionDay: 5,
        }),
      ).toThrow(DeadlineDaysRequiredError);
    });

    it('should throw NumberMustBePositiveAndInt when deadlineDays is 0', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
          dueDateDay: null,
          deadlineDays: 0,
          emissionDay: 5,
        }),
      ).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw NumberMustBePositiveAndInt when deadlineDays is negative', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
          dueDateDay: null,
          deadlineDays: -1,
          emissionDay: 5,
        }),
      ).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw DeadlineDaysRequiredError when deadlineDays is undefined', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
          dueDateDay: null,
          deadlineDays: undefined as unknown as number | null,
          emissionDay: 5,
        }),
      ).toThrow(DeadlineDaysRequiredError);
    });

    it('should throw NumberMustBePositiveAndInt when deadlineDays is decimal', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
          dueDateDay: null,
          deadlineDays: 10.5,
          emissionDay: 5,
        }),
      ).toThrow(NumberMustBePositiveAndInt);
    });

    it('should accept deadlineDays 1 as valid boundary', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 1,
        emissionDay: 5,
      });

      expect(config.value.deadlineDays).toBe(1);
    });

    it('should ignore dueDateDay and set to null when DEADLINE', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: 15,
        deadlineDays: 10,
        emissionDay: 5,
      });

      expect(config.value.dueDateDay).toBeNull();
      expect(config.value.deadlineDays).toBe(10);
    });

    it('should throw InvalidEmissionDayError when emissionDay is invalid for DEADLINE', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
          dueDateDay: null,
          deadlineDays: 10,
          emissionDay: 0,
        }),
      ).toThrow(InvalidEmissionDayError);
    });
  });

  describe('dueDateType validation', () => {
    it('should throw AppException when dueDateType is invalid', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: 'INVALID' as ClientInvoiceConfigDueDateType,
          dueDateDay: 15,
          deadlineDays: null,
          emissionDay: 5,
        }),
      ).toThrow(AppException);
    });

    it('should throw AppException when dueDateType is empty string', () => {
      expect(() =>
        new InvoiceDueDateConfig({
          dueDateType: '' as ClientInvoiceConfigDueDateType,
          dueDateDay: 15,
          deadlineDays: null,
          emissionDay: 5,
        }),
      ).toThrow(AppException);
    });

    it('should accept dueDateType by enum value', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 15,
        deadlineDays: null,
        emissionDay: 5,
      });

      expect(config.value.dueDateType).toBe(ClientInvoiceConfigDueDateType.DUE_DATE);
    });

    it('should accept dueDateType by Portuguese label for DUE_DATE', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: 'Dia de vencimento' as ClientInvoiceConfigDueDateType,
        dueDateDay: 15,
        deadlineDays: null,
        emissionDay: 5,
      });

      expect(config.value.dueDateType).toBe(ClientInvoiceConfigDueDateType.DUE_DATE);
    });

    it('should accept dueDateType by Portuguese label for DEADLINE', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: 'Prazo faturamento' as ClientInvoiceConfigDueDateType,
        dueDateDay: null,
        deadlineDays: 10,
        emissionDay: 5,
      });

      expect(config.value.dueDateType).toBe(ClientInvoiceConfigDueDateType.DEADLINE);
    });
  });

  describe('value', () => {
    it('should return a copy of the value', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 20,
        deadlineDays: null,
        emissionDay: 5,
      });
      const value = config.value;

      expect(value.dueDateType).toBe(ClientInvoiceConfigDueDateType.DUE_DATE);
      expect(value.dueDateDay).toBe(20);
      expect(value.deadlineDays).toBeNull();
      expect(value.emissionDay).toBe(5);
    });

    it('should return a new object on each access', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 20,
        deadlineDays: null,
        emissionDay: 5,
      });

      const firstAccess = config.value;
      const secondAccess = config.value;

      expect(firstAccess).not.toBe(secondAccess);
      expect(firstAccess).toEqual(secondAccess);
    });

    it('should preserve immutability when mutating returned value', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 20,
        deadlineDays: null,
        emissionDay: 5,
      });
      const value = config.value as unknown as Record<string, unknown>;

      value.dueDateDay = 99;

      expect(config.value.dueDateDay).toBe(20);
    });

    it('should include emissionDay in returned value for DUE_DATE', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 15,
        deadlineDays: null,
        emissionDay: 10,
      });

      expect(config.value.emissionDay).toBe(10);
    });

    it('should include emissionDay in returned value for DEADLINE', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 7,
        emissionDay: 25,
      });

      expect(config.value.emissionDay).toBe(25);
    });
  });

  describe('isDueDateType and isDeadlineType', () => {
    it('should return correct values for DUE_DATE', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 15,
        deadlineDays: null,
        emissionDay: 5,
      });

      expect(config.isDueDateType()).toBe(true);
      expect(config.isDeadlineType()).toBe(false);
    });

    it('should return correct values for DEADLINE', () => {
      const config = new InvoiceDueDateConfig({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 10,
        emissionDay: 5,
      });

      expect(config.isDueDateType()).toBe(false);
      expect(config.isDeadlineType()).toBe(true);
    });
  });
});
