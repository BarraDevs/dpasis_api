import { InvalidDueDateDayError } from 'src/shared/value-objects/due-date-day/due-date-day.error';
import { DueDateDay } from 'src/shared/value-objects/due-date-day/due-date-day.vo';
import { EmissionDay } from 'src/shared/value-objects/emission-day/emission-day.vo';
import { Enum } from 'src/shared/value-objects/enum/enum.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import { ClientInvoiceConfigDueDateType } from '../../enums/client-invoice-config-due-date-type.enum';
import { DeadlineDaysRequiredError } from './invoice-due-date-config.error';

export interface InvoiceDueDateConfigProps {
  dueDateType: ClientInvoiceConfigDueDateType;
  dueDateDay: number | null;
  deadlineDays: number | null;
  emissionDay: number;
}

export class InvoiceDueDateConfig {
  private readonly _value: InvoiceDueDateConfigProps;

  constructor(props: InvoiceDueDateConfigProps) {
    const { dueDateDay, deadlineDays } = props;

    const dueDateType = new Enum(props.dueDateType, ClientInvoiceConfigDueDateType, 'dueDateType').value;
    const emissionDay = new EmissionDay(props.emissionDay).value;

    if (dueDateType === ClientInvoiceConfigDueDateType.DUE_DATE) {
      if (dueDateDay == null) {
        throw new InvalidDueDateDayError();
      }
      const validatedDueDateDay = new DueDateDay(dueDateDay, emissionDay).value;
      this._value = {
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: validatedDueDateDay,
        deadlineDays: null,
        emissionDay,
      };
    }
    else {
      if (deadlineDays == null) {
        throw new DeadlineDaysRequiredError();
      }
      const validatedDeadlineDays = new PositiveInt(deadlineDays, 'deadlineDays').value;
      this._value = {
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: validatedDeadlineDays,
        emissionDay,
      };
    }
  }

  public get value(): InvoiceDueDateConfigProps {
    return { ...this._value };
  }

  public isDueDateType(): boolean {
    return this._value.dueDateType === ClientInvoiceConfigDueDateType.DUE_DATE;
  }

  public isDeadlineType(): boolean {
    return this._value.dueDateType === ClientInvoiceConfigDueDateType.DEADLINE;
  }
}
