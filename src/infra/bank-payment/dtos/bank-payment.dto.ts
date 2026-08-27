import { BankPaymentProvider } from '../enums/bank-payment-provider.enum';
import { BankPaymentStatus } from '../enums/bank-payment-status.enum';
import { BankPaymentPayerDto } from './bank-payment-payer.dto';

export class BankPaymentBoletoDto {
  ourNumber?: string;
  barcode?: string;
  digitableLine?: string;
}

export class BankPaymentPixDto {
  txid?: string;
  copyAndPaste?: string;
}

export class BankPaymentDto {
  provider: BankPaymentProvider;
  requestCode: string;
  yourNumber: string;
  status: BankPaymentStatus;
  amount: number;
  dueDate: string;
  daysAfterDue?: number;
  payer: BankPaymentPayerDto;
  boleto?: BankPaymentBoletoDto;
  pix?: BankPaymentPixDto;
}
