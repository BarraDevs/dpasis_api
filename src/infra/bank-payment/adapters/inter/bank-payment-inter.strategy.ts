import { Injectable } from '@nestjs/common';
import { IssueBankSlipInputDto, IssueBankSlipOutputDto } from '../../dtos/issue-bank-slip.dto';
import { BankPaymentProvider } from '../../enums/bank-payment-provider.enum';
import type { IBankPaymentStrategy } from '../../strategies/bank-payment.strategy';

@Injectable()
export class BankPaymentInterStrategy implements IBankPaymentStrategy {
  public readonly provider = BankPaymentProvider.INTER;

  public async issue(input: IssueBankSlipInputDto): Promise<IssueBankSlipOutputDto> {
    return {
      provider: input.provider,
      externalId: 'inter-stub',
    };
  }
}
