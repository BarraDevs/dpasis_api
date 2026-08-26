import { IssueBankSlipInputDto, IssueBankSlipOutputDto } from '../dtos/issue-bank-slip.dto';
import { BankSlipProvider } from '../enums/bank-slip-provider.enum';

export interface IBankSlipGenerationStrategy {
  readonly provider: BankSlipProvider;
  issue(input: IssueBankSlipInputDto): Promise<IssueBankSlipOutputDto>;
}
