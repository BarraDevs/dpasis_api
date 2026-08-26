import { Injectable } from '@nestjs/common';
import type { IBankPaymentGateway } from '../../bank-payment.gateway';
import { IssueBankSlipInputDto, IssueBankSlipOutputDto } from '../../dtos/issue-bank-slip.dto';
import { BankPaymentProvider } from '../../enums/bank-payment-provider.enum';

@Injectable()
export class BankPaymentFakeAdapterGateway implements IBankPaymentGateway {
  public readonly issueCalls: IssueBankSlipInputDto[] = [];
  public issueResult: IssueBankSlipOutputDto = {
    provider: BankPaymentProvider.INTER,
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
