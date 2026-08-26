import { IssueBankSlipInputDto, IssueBankSlipOutputDto } from './dtos/issue-bank-slip.dto';

export interface IBankPaymentGateway {
  issue(input: IssueBankSlipInputDto): Promise<IssueBankSlipOutputDto>;
}
