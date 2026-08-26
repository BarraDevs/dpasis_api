import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from '../../bank-payment.gateway';
import { IssueBankSlipInputDto, IssueBankSlipOutputDto } from '../../dtos/issue-bank-slip.dto';
import { BankPaymentProviderNotSupportedError } from '../../errors/bank-payment-provider-not-supported.error';
import type { IBankPaymentStrategy } from '../../strategies/bank-payment.strategy';

@Injectable()
export class BankPaymentStrategyAdapterGateway implements IBankPaymentGateway {
  constructor(
    @Inject(TOKENS.BankPaymentStrategies) private readonly strategies: IBankPaymentStrategy[],
  ) {}

  public async issue(input: IssueBankSlipInputDto): Promise<IssueBankSlipOutputDto> {
    const strategy = this.strategies.find((item) => item.provider === input.provider);
    if (!strategy) {
      throw new BankPaymentProviderNotSupportedError(input.provider);
    }
    return strategy.issue(input);
  }
}
