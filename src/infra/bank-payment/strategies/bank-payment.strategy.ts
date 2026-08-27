import { IBankPaymentGateway } from '../bank-payment.gateway';
import { BankPaymentProvider } from '../enums/bank-payment-provider.enum';

export interface IBankPaymentStrategy extends IBankPaymentGateway {
  readonly provider: BankPaymentProvider;
}
