import { BankPaymentProvider } from '../enums/bank-payment-provider.enum';
import { BankPaymentStatus } from '../enums/bank-payment-status.enum';
import { BankPaymentCredentialsDto } from './bank-payment-credentials.dto';
import { BankPaymentDto } from './bank-payment.dto';

export class ListBankPaymentInputDto {
  provider: BankPaymentProvider;
  startDate: string;
  endDate: string;
  status?: BankPaymentStatus;
  /** `seuNumero` no Inter — a chave que amarra a cobrança à NFS-e que a originou. */
  yourNumber?: string;
  payerName?: string;
  payerDocument?: string;
  page?: number;
  size?: number;
  credentials: BankPaymentCredentialsDto;
}

export class ListBankPaymentOutputDto {
  items: BankPaymentDto[];
  total: number;
}
