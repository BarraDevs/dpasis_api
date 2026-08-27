import { BankPaymentProvider } from '../enums/bank-payment-provider.enum';

export class CancelBankPaymentInputDto {
  provider: BankPaymentProvider;
  requestCode: string;
  reason: string;
}
