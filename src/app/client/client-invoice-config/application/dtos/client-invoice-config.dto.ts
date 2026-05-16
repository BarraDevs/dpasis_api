import { ClientAddressDto } from 'src/app/client/client-address/application/dtos/client-address.dto';
import { ClientInvoiceConfigDueDateType } from '../../domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from '../../domain/enums/client-invoice-config-type.enum';
import { BankDto } from 'src/app/global/bank/application/dtos/bank.dto';

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
  billingAddress: ClientAddressDto;
  bank: BankDto;
  autoProtestBoleto: boolean;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
}
