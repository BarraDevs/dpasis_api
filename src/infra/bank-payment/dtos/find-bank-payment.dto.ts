import { BankPaymentProvider } from '../enums/bank-payment-provider.enum';

export class FindBankPaymentInputDto {
  provider: BankPaymentProvider;
  requestCode: string;
}
