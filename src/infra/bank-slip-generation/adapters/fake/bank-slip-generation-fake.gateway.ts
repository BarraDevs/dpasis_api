import { Injectable } from '@nestjs/common';
import type { IBankSlipGenerationGateway } from '../../bank-slip-generation.gateway';
import { IssueBankSlipInputDto, IssueBankSlipOutputDto } from '../../dtos/issue-bank-slip.dto';
import { BankSlipProvider } from '../../enums/bank-slip-provider.enum';

@Injectable()
export class BankSlipGenerationFakeAdapterGateway implements IBankSlipGenerationGateway {
  public readonly issueCalls: IssueBankSlipInputDto[] = [];
  public issueResult: IssueBankSlipOutputDto = {
    provider: BankSlipProvider.INTER,
    externalId: 'fake-external-id',
  };
  public issueError: Error | null = null;

  public async issue(input: IssueBankSlipInputDto): Promise<IssueBankSlipOutputDto> {
    this.issueCalls.push(input);
    if (this.issueError) {
      return Promise.reject(this.issueError);
    }
    return Promise.resolve(this.issueResult);
  }
}
