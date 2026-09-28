import { BankPaymentProvider } from '../enums/bank-payment-provider.enum';
import { BankPaymentCredentialsDto } from './bank-payment-credentials.dto';

export class CancelBankPaymentInputDto {
  provider: BankPaymentProvider;
  requestCode: string;
  reason: string;
  credentials: BankPaymentCredentialsDto;
}
