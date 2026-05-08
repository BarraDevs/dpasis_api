import { ClientInvoiceConfigDueDateType } from '../../domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from '../../domain/enums/client-invoice-config-type.enum';

export class ClientInvoiceConfigDto {
  id: number;
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
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
}
