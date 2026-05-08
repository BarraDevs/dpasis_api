import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import { Day } from 'src/shared/value-objects/day/day.vo';

export interface InvoiceDeadlineDaysProps {
  emissionDay: number;
  deadlineDays: number;
}

export class InvoiceDeadlineDays {
  private readonly _value: InvoiceDeadlineDaysProps;

  constructor(props: InvoiceDeadlineDaysProps) {
    const emissionDay = new Day(props.emissionDay).value;
    const deadlineDays = new PositiveInt(props.deadlineDays, 'deadlineDays', false).value;

    this._value = {
      emissionDay,
      deadlineDays,
    };
  }

  public get value(): InvoiceDeadlineDaysProps {
    return { ...this._value };
  }
}
