import { BankPaymentCancelReason } from '../enums/bank-payment-cancel-reason.enum';
import { BankPaymentProvider } from '../enums/bank-payment-provider.enum';

export class CancelBankPaymentInputDto {
  provider: BankPaymentProvider;
  requestCode: string;
  reason: BankPaymentCancelReason;
}
