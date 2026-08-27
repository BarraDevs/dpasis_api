import { BankPaymentProvider } from '../enums/bank-payment-provider.enum';

export class BankPaymentPdfDto {
  provider: BankPaymentProvider;
  requestCode: string;
  pdf: string;
}
