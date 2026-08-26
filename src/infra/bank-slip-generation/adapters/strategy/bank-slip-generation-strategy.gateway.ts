import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IBankSlipGenerationGateway } from '../../bank-slip-generation.gateway';
import { IssueBankSlipInputDto, IssueBankSlipOutputDto } from '../../dtos/issue-bank-slip.dto';
import { BankSlipProviderNotSupportedError } from '../../errors/bank-slip-provider-not-supported.error';
import type { IBankSlipGenerationStrategy } from '../../strategies/bank-slip-generation.strategy';

@Injectable()
export class BankSlipGenerationStrategyAdapterGateway implements IBankSlipGenerationGateway {
  constructor(
    @Inject(TOKENS.BankSlipGenerationStrategies) private readonly strategies: IBankSlipGenerationStrategy[],
  ) {}

  public async issue(input: IssueBankSlipInputDto): Promise<IssueBankSlipOutputDto> {
    const strategy = this.strategies.find((item) => item.provider === input.provider);
    if (!strategy) {
      throw new BankSlipProviderNotSupportedError(input.provider);
    }
    return strategy.issue(input);
  }
}
