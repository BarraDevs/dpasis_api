import { ClientInvoiceConfigDueDateType } from '../enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from '../enums/client-invoice-config-type.enum';

export type ClientInvoiceConfigProps = ClientInvoiceConfigCreateProps & {
  id: number | null;
};

export type ClientInvoiceConfigCreateProps = {
  clientId: number;
  generateNf: boolean;
  type: ClientInvoiceConfigType;
  emissionDay: number;
  dueDateType: ClientInvoiceConfigDueDateType;
  dueDateDay: number | null;
  dueMonth: number | null;
  deadlineDays: number | null;
  months: number[];
  billingAddressId: number;
  bankId: number;
  autoProtestBoleto: boolean;
  issWithheld: boolean;
  message: string | null;
};

export class ClientInvoiceConfig {
  private readonly _props: ClientInvoiceConfigProps;

  static _instantiate(props: ClientInvoiceConfigProps): ClientInvoiceConfig {
    return new ClientInvoiceConfig(props);
  }

  private constructor(props: ClientInvoiceConfigProps) {
    this._props = {
      id: props.id,
      clientId: props.clientId,
      generateNf: props.generateNf,
      type: props.type,
      emissionDay: props.emissionDay,
      dueDateType: props.dueDateType,
      dueDateDay: props.dueDateDay,
      dueMonth: props.dueMonth,
      deadlineDays: props.deadlineDays,
      months: props.months,
      billingAddressId: props.billingAddressId,
      bankId: props.bankId,
      autoProtestBoleto: props.autoProtestBoleto,
      issWithheld: props.issWithheld,
      message: props.message,
    };
  }

  public get props(): Readonly<ClientInvoiceConfigProps> {
    return { ...this._props };
  }
}
