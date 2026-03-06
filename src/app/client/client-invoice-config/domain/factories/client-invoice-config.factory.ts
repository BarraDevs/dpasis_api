import { BillingMonths } from 'src/shared/value-objects/billing-months/billing-months.vo';
import { BooleanVo } from 'src/shared/value-objects/boolean/boolean.vo';
import { Enum } from 'src/shared/value-objects/enum/enum.vo';
import { OptionalString } from 'src/shared/value-objects/optional-string/optional-string.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import {
  ClientInvoiceConfig,
  ClientInvoiceConfigCreateProps,
  ClientInvoiceConfigProps,
} from '../entities/client-invoice-config.entity';
import { ClientInvoiceConfigType } from '../enums/client-invoice-config-type.enum';
import { InvoiceDueDateConfig } from '../value-objects/invoice-due-date-config/invoice-due-date-config.vo';

export class ClientInvoiceConfigFactory {
  private static validateCreateProps(props: ClientInvoiceConfigCreateProps): ClientInvoiceConfigCreateProps {
    const invoiceDueDateConfig = new InvoiceDueDateConfig({
      dueDateType: props.dueDateType,
      dueDateDay: props.dueDateDay ?? null,
      deadlineDays: props.deadlineDays ?? null,
      emissionDay: props.emissionDay,
    });

    return {
      emissionDay: invoiceDueDateConfig.value.emissionDay,
      dueDateType: invoiceDueDateConfig.value.dueDateType,
      dueDateDay: invoiceDueDateConfig.value.dueDateDay,
      deadlineDays: invoiceDueDateConfig.value.deadlineDays,
      clientId: new PositiveInt(props.clientId, 'clientId').value,
      generateNf: new BooleanVo(props.generateNf, 'generateNf').value,
      type: new Enum(props.type, ClientInvoiceConfigType, 'type').value,
      months: new BillingMonths(props.months ?? [], props.type === ClientInvoiceConfigType.ANNUAL).value,
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
      ...props,
      id: props.id,
      months: props.months ?? [],
    });
  }
}
