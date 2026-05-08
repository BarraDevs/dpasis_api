import { Day } from 'src/shared/value-objects/day/day.vo';
import { Month } from 'src/shared/value-objects/month/month.vo';
import { DueDateIsLessThanEmissionDayError, DueDateIsLessThanMinimumIntervalBetweenEmissionDayAndDueDateDayError } from './invoice-due-date.error';

export interface InvoiceDueDateProps {
  emissionDay: number;
  dueDateDay: number;
  dueMonth: number;
}

export class InvoiceDueDate {
  private readonly MINIMUM_INTERVAL_BETWEEN_EMISSION_DAY_AND_DUE_DATE_DAY = 15;
  private readonly _value: InvoiceDueDateProps;

  constructor(props: InvoiceDueDateProps) {
    const emissionDay = new Day(props.emissionDay).value;
    const dueDateDay = new Day(props.dueDateDay).value;
    const dueMonth = new Month(props.dueMonth).value;

    if (this.isDueDateLessThanEmissionDay(dueDateDay, emissionDay)) {
      throw new DueDateIsLessThanEmissionDayError();
    }
    if (this.isDueDateLessThanMinimumIntervalBetweenEmissionDayAndDueDateDay(dueDateDay, emissionDay)) {
      throw new DueDateIsLessThanMinimumIntervalBetweenEmissionDayAndDueDateDayError();
    }

    this._value = {
      emissionDay,
      dueDateDay,
      dueMonth,
    };
  }

  public get value(): InvoiceDueDateProps {
    return { ...this._value };
  }

  private isDueDateLessThanEmissionDay(dueDateDay: number, emissionDay: number): boolean {
    return dueDateDay <= emissionDay;
  }

  private isDueDateLessThanMinimumIntervalBetweenEmissionDayAndDueDateDay(dueDateDay: number, emissionDay: number): boolean {
    return dueDateDay - emissionDay < this.MINIMUM_INTERVAL_BETWEEN_EMISSION_DAY_AND_DUE_DATE_DAY;
  }
}
