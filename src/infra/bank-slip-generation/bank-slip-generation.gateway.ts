import { IssueBankSlipInputDto, IssueBankSlipOutputDto } from './dtos/issue-bank-slip.dto';

export interface IBankSlipGenerationGateway {
  issue(input: IssueBankSlipInputDto): Promise<IssueBankSlipOutputDto>;
}
