import { BankPaymentProvider } from '../enums/bank-payment-provider.enum';
import { BankPaymentCredentialsDto } from './bank-payment-credentials.dto';

export class FindBankPaymentInputDto {
  provider: BankPaymentProvider;
  requestCode: string;
  credentials: BankPaymentCredentialsDto;
}
