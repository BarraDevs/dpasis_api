import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';

export class FindBankPaymentByYourNumberInputDto {
  provider: BankPaymentProvider;
  yourNumber: string;
  amount: number;
  dueDate: string;
}
