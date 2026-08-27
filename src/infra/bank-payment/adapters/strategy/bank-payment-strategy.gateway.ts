import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from '../../bank-payment.gateway';
import { BankPaymentDto } from '../../dtos/bank-payment.dto';
import { CancelBankPaymentInputDto } from '../../dtos/cancel-bank-payment.dto';
import { FindBankPaymentInputDto } from '../../dtos/find-bank-payment.dto';
import { IssueBankPaymentInputDto, IssueBankPaymentOutputDto } from '../../dtos/issue-bank-payment.dto';
import { BankPaymentProviderNotSupportedError } from '../../errors/bank-payment-provider-not-supported.error';
import type { IBankPaymentStrategy } from '../../strategies/bank-payment.strategy';

@Injectable()
export class BankPaymentStrategyAdapterGateway implements IBankPaymentGateway {
  constructor(
    @Inject(TOKENS.BankPaymentStrategies) private readonly strategies: IBankPaymentStrategy[],
  ) {}

  public async issue(input: IssueBankPaymentInputDto): Promise<IssueBankPaymentOutputDto> {
    return this.resolve(input.provider).issue(input);
  }

  public async find(input: FindBankPaymentInputDto): Promise<BankPaymentDto> {
    return this.resolve(input.provider).find(input);
  }

  public async cancel(input: CancelBankPaymentInputDto): Promise<void> {
    return this.resolve(input.provider).cancel(input);
  }

  private resolve(provider: IssueBankPaymentInputDto['provider']): IBankPaymentStrategy {
    const strategy = this.strategies.find((item) => item.provider === provider);
    if (!strategy) {
      throw new BankPaymentProviderNotSupportedError(provider);
    }
    return strategy;
  }
}
