import { Injectable } from '@nestjs/common';
import { IssueBankSlipInputDto, IssueBankSlipOutputDto } from '../../dtos/issue-bank-slip.dto';
import { BankSlipProvider } from '../../enums/bank-slip-provider.enum';
import type { IBankSlipGenerationStrategy } from '../../strategies/bank-slip-generation.strategy';

@Injectable()
export class BankSlipGenerationInterStrategy implements IBankSlipGenerationStrategy {
  public readonly provider = BankSlipProvider.INTER;

  public async issue(input: IssueBankSlipInputDto): Promise<IssueBankSlipOutputDto> {
    return {
      provider: input.provider,
      externalId: 'inter-stub',
    };
  }
}
