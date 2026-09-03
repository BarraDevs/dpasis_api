import { DateTime } from 'luxon';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { Day } from 'src/shared/value-objects/day/day.vo';
import { Enum } from 'src/shared/value-objects/enum/enum.vo';
import { Month } from 'src/shared/value-objects/month/month.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import { ClientInvoiceConfigDueDateType } from '../../enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from '../../enums/client-invoice-config-type.enum';
import {
  InvoiceCalendarDeadlineDaysMissingError,
  InvoiceCalendarDueDateDayMissingError,
  InvoiceCalendarDueMonthMissingError,
  InvoiceCalendarInvalidCompetenceError,
} from './invoice-calendar-due-date.error';

export type InvoiceCalendarDueDateProps = {
  invoiceType: string;
  dueDateType: string;
  dueDateDay: number | null;
  dueMonth: number | null;
  deadlineDays: number | null;
  referenceYear: number;
  referenceMonth: number;
  issuedAt: Date;
};

export class InvoiceCalendarDueDate {
  private readonly _value: string;

  constructor(props: InvoiceCalendarDueDateProps) {
    const dueDateType = new Enum(props.dueDateType, ClientInvoiceConfigDueDateType, 'dueDateType').value;
    const invoiceType = new Enum(props.invoiceType, ClientInvoiceConfigType, 'invoiceType').value;

    if (dueDateType === ClientInvoiceConfigDueDateType.DEADLINE) {
      this._value = this.resolveDeadline(props.issuedAt, props.deadlineDays);
      return;
    }

    this._value = this.resolveFixedDueDate({
      invoiceType,
      dueDateDay: props.dueDateDay,
      dueMonth: props.dueMonth,
      referenceYear: props.referenceYear,
      referenceMonth: props.referenceMonth,
    });
  }

  public get value(): string {
    return this._value;
  }

  private resolveDeadline(issuedAt: Date, deadlineDays: number | null): string {
    if (deadlineDays == null) {
      throw new InvoiceCalendarDeadlineDaysMissingError();
    }

    const days = new PositiveInt(deadlineDays, 'deadlineDays', true).value;

    return DateTime.fromJSDate(issuedAt, { zone: SAO_PAULO_TIMEZONE })
      .plus({ days })
      .toFormat('yyyy-MM-dd');
  }

  private resolveFixedDueDate(params: {
    invoiceType: ClientInvoiceConfigType;
    dueDateDay: number | null;
    dueMonth: number | null;
    referenceYear: number;
    referenceMonth: number;
  }): string {
    if (params.dueDateDay == null) {
      throw new InvoiceCalendarDueDateDayMissingError();
    }

    const dueDateDay = new Day(params.dueDateDay).value;
    const year = params.referenceYear;
    let month = params.referenceMonth;

    if (params.invoiceType === ClientInvoiceConfigType.ANNUAL) {
      if (params.dueMonth == null) {
        throw new InvoiceCalendarDueMonthMissingError();
      }
      month = new Month(params.dueMonth).value;
    }
    else {
      month = new Month(params.referenceMonth).value;
    }

    if (!Number.isInteger(year) || year < 1) {
      throw new InvoiceCalendarInvalidCompetenceError();
    }

    const competence = DateTime.fromObject(
      { year, month, day: 1 },
      { zone: SAO_PAULO_TIMEZONE },
    );

    if (!competence.isValid || !competence.daysInMonth) {
      throw new InvoiceCalendarInvalidCompetenceError();
    }

    const day = Math.min(dueDateDay, competence.daysInMonth);
    return DateTime.fromObject(
      { year, month, day },
      { zone: SAO_PAULO_TIMEZONE },
    ).toFormat('yyyy-MM-dd');
  }
}
