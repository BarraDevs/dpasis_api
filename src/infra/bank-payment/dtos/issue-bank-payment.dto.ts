import { BankPaymentProvider } from '../enums/bank-payment-provider.enum';
import { BankPaymentPayerDto } from './bank-payment-payer.dto';

export class IssueBankPaymentInputDto {
  provider: BankPaymentProvider;
  yourNumber: string;
  amount: number;
  dueDate: string;
  daysAfterDue: number;
  payer: BankPaymentPayerDto;
}

export class IssueBankPaymentOutputDto {
  provider: BankPaymentProvider;
  requestCode: string;
}
