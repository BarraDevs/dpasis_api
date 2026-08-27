import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { IssueBankPaymentInputDto, IssueBankPaymentOutputDto } from './dtos/issue-bank-payment.dto';

@Injectable()
export class IssueBankPayment {
  constructor(
    @Inject(TOKENS.BankPaymentGateway) private readonly bankPaymentGateway: IBankPaymentGateway,
  ) {}

  public async execute(input: IssueBankPaymentInputDto): Promise<IssueBankPaymentOutputDto> {
    return this.bankPaymentGateway.issue(input);
  }
}
