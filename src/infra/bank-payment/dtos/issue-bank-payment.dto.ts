import { BankPaymentProvider } from '../enums/bank-payment-provider.enum';
import { BankPaymentCredentialsDto } from './bank-payment-credentials.dto';
import { BankPaymentPayerDto } from './bank-payment-payer.dto';

export class IssueBankPaymentInputDto {
  /** Só para a trilha de tentativas; o provedor não recebe este campo. */
  nfseId?: number;
  provider: BankPaymentProvider;
  yourNumber: string;
  amount: number;
  dueDate: string;
  daysAfterDue: number;
  payer: BankPaymentPayerDto;
  fineRate?: number | null;
  moraRate?: number | null;
  credentials: BankPaymentCredentialsDto;
}

export class IssueBankPaymentOutputDto {
  provider: BankPaymentProvider;
  requestCode: string;
}
