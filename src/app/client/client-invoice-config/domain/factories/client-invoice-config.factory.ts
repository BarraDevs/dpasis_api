import { BooleanVo } from 'src/shared/value-objects/boolean/boolean.vo';
import { Enum } from 'src/shared/value-objects/enum/enum.vo';
import { OptionalString } from 'src/shared/value-objects/optional-string/optional-string.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import {
  ClientInvoiceConfig,
  ClientInvoiceConfigCreateProps,
  ClientInvoiceConfigProps,
} from '../entities/client-invoice-config.entity';
import { ClientInvoiceConfigDueDateType } from '../enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from '../enums/client-invoice-config-type.enum';
import { InvalidDueDateDayError } from '../errors/invalid-due-date-day.error';
import { InvalidEmissionDayError } from '../errors/invalid-emission-day.error';
import { InvalidMonthsAnnualError } from '../errors/invalid-months-annual.error';

export class ClientInvoiceConfigFactory {
  private static readonly VALID_DAY_RANGE = { min: 1, max: 31 };
  private static readonly VALID_MONTH_RANGE = { min: 1, max: 12 };

  private static validateEmissionDay(day: number): number {
    if (
      !Number.isInteger(day) ||
      day < this.VALID_DAY_RANGE.min ||
      day > this.VALID_DAY_RANGE.max
    ) {
      throw new InvalidEmissionDayError();
    }
    return day;
  }

  private static validateDueDateDay(day: number, emissionDay: number): number {
    if (
      !Number.isInteger(day) ||
      day < this.VALID_DAY_RANGE.min ||
      day > this.VALID_DAY_RANGE.max ||
      day <= emissionDay
    ) {
      throw new InvalidDueDateDayError();
    }
    return day;
  }

  private static validateMonths(months: number[], type: ClientInvoiceConfigType): number[] {
    if (type === ClientInvoiceConfigType.ANNUAL) {
      if (!Array.isArray(months) || months.length === 0) {
        throw new InvalidMonthsAnnualError();
      }
      const validMonths = months.filter(
        m =>
          Number.isInteger(m) &&
          m >= this.VALID_MONTH_RANGE.min &&
          m <= this.VALID_MONTH_RANGE.max,
      );
      if (validMonths.length !== months.length) {
        throw new InvalidMonthsAnnualError();
      }
      return [...new Set(validMonths)].sort((a, b) => a - b);
    }
    return [];
  }

  private static validateCreateProps(props: ClientInvoiceConfigCreateProps): ClientInvoiceConfigCreateProps {
    const type = new Enum(props.type, ClientInvoiceConfigType, 'type').value;
    const dueDateType = new Enum(
      props.dueDateType,
      ClientInvoiceConfigDueDateType,
      'dueDateType',
    ).value;
    const emissionDay = this.validateEmissionDay(props.emissionDay);

    let dueDateDay: number | null = null;
    let deadlineDays: number | null = null;

    if (dueDateType === ClientInvoiceConfigDueDateType.DUE_DATE) {
      if (props.dueDateDay == null) {
        throw new InvalidDueDateDayError();
      }
      dueDateDay = this.validateDueDateDay(props.dueDateDay, emissionDay);
    } else {
      if (props.deadlineDays == null) {
        throw new Error('Para tipo prazo, informe a quantidade de dias.');
      }
      deadlineDays = new PositiveInt(props.deadlineDays, 'deadlineDays').value;
    }

    const months = this.validateMonths(props.months ?? [], type);

    return {
      clientId: new PositiveInt(props.clientId, 'clientId').value,
      generateNf: new BooleanVo(props.generateNf, 'generateNf').value,
      type,
      emissionDay,
      dueDateType,
      dueDateDay,
      deadlineDays,
      months,
      billingAddressId: new PositiveInt(props.billingAddressId, 'billingAddressId').value,
      bankId: new PositiveInt(props.bankId, 'bankId').value,
      autoProtestBoleto: new BooleanVo(props.autoProtestBoleto, 'autoProtestBoleto').value,
      message: new OptionalString(props.message ?? null, 'message').value,
    };
  }

  static create(props: ClientInvoiceConfigCreateProps): ClientInvoiceConfig {
    const validatedProps = this.validateCreateProps(props);

    return ClientInvoiceConfig._instantiate({
      ...validatedProps,
      id: null,
    });
  }

  static edit(props: ClientInvoiceConfigProps): ClientInvoiceConfig {
    const validatedProps = this.validateCreateProps(props);

    return ClientInvoiceConfig._instantiate({
      ...validatedProps,
      id: props.id,
    });
  }

  static load(props: ClientInvoiceConfigProps): ClientInvoiceConfig {
    return ClientInvoiceConfig._instantiate({
      id: props.id,
      clientId: props.clientId,
      generateNf: props.generateNf,
      type: props.type,
      emissionDay: props.emissionDay,
      dueDateType: props.dueDateType,
      dueDateDay: props.dueDateDay,
      deadlineDays: props.deadlineDays,
      months: props.months ?? [],
      billingAddressId: props.billingAddressId,
      bankId: props.bankId,
      autoProtestBoleto: props.autoProtestBoleto,
      message: props.message,
    });
  }
}
