import { BillingMonths } from 'src/shared/value-objects/billing-months/billing-months.vo';
import { BooleanVo } from 'src/shared/value-objects/boolean/boolean.vo';
import { OptionalString } from 'src/shared/value-objects/optional-string/optional-string.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import {
  ClientInvoiceConfig,
  ClientInvoiceConfigCreateProps,
  ClientInvoiceConfigProps,
} from '../entities/client-invoice-config.entity';
import { ClientInvoiceConfigType } from '../enums/client-invoice-config-type.enum';
import { ClientInvoiceConfigDueDateType } from '../enums/client-invoice-config-due-date-type.enum';
import { InvoiceDueDate } from '../value-objects/invoice-due-date/invoice-due-date.vo';
import { InvoiceDeadlineDays } from '../value-objects/invoice-deadline-days/invoice-deadline-days.vo';
import { InvalidClientInvoiceDueDateTypeError } from '../errors/invalid-client-invoice-due-date-type.error';
import { Enum } from 'src/shared/value-objects/enum/enum.vo';

export class ClientInvoiceConfigFactory {
  private static validateCreateProps(props: ClientInvoiceConfigCreateProps): ClientInvoiceConfigCreateProps {
    const dueDateType = new Enum(props.dueDateType, ClientInvoiceConfigDueDateType, 'dueDateType').value;
    const emissionDay = new PositiveInt(props.emissionDay, 'emissionDay').value;

    let dueDateDay: number | null = null;
    let deadlineDays: number | null = null;
    let dueMonth: number | null = null;

    switch (dueDateType) {
      case ClientInvoiceConfigDueDateType.DUE_DATE:
        const invoiceDueDate = new InvoiceDueDate({
          emissionDay,
          dueDateDay: props.dueDateDay!,
          dueMonth: props.dueMonth!,
        });

        dueDateDay = invoiceDueDate.value.dueDateDay;
        dueMonth = invoiceDueDate.value.dueMonth;
        deadlineDays = null;
        break;
      case ClientInvoiceConfigDueDateType.DEADLINE:
        const invoiceDeadlineDays = new InvoiceDeadlineDays({
          emissionDay,
          deadlineDays: props.deadlineDays!,
        });

        dueDateDay = null;
        dueMonth = null;
        deadlineDays = invoiceDeadlineDays.value.deadlineDays;
        break;
      default:
        throw new InvalidClientInvoiceDueDateTypeError();
    }

    return {
      dueDateType,
      emissionDay,
      dueDateDay,
      dueMonth,
      deadlineDays,

      clientId: new PositiveInt(props.clientId, 'clientId').value,
      billingAddressId: new PositiveInt(props.billingAddressId, 'billingAddressId').value,
      bankId: new PositiveInt(props.bankId, 'bankId').value,

      type: new Enum(props.type, ClientInvoiceConfigType, 'type').value,
      months: new BillingMonths(props.months ?? [], props.type === ClientInvoiceConfigType.ANNUAL).value,

      generateNf: new BooleanVo(props.generateNf, 'generateNf').value,
      autoProtestBoleto: new BooleanVo(props.autoProtestBoleto, 'autoProtestBoleto').value,
      issWithheld: new BooleanVo(props.issWithheld, 'issWithheld').value,
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
      ...props,
      id: props.id,
      months: props.months ?? [],
    });
  }
}
