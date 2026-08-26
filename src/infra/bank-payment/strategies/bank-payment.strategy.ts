import { IssueBankSlipInputDto, IssueBankSlipOutputDto } from '../dtos/issue-bank-slip.dto';
import { BankPaymentProvider } from '../enums/bank-payment-provider.enum';

export interface IBankPaymentStrategy {
  readonly provider: BankPaymentProvider;
  issue(input: IssueBankSlipInputDto): Promise<IssueBankSlipOutputDto>;
}
