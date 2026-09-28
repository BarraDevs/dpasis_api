import { Inject, Injectable } from '@nestjs/common';
import { ResolveBankIntegrationCredentials } from 'src/app/global/bank/application/usecases/resolve-bank-integration-credentials/resolve-bank-integration-credentials.service';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { IssueBankPaymentInputDto, IssueBankPaymentOutputDto } from './dtos/issue-bank-payment.dto';

@Injectable()
export class IssueBankPayment {
  constructor(
    @Inject(TOKENS.BankPaymentGateway) private readonly bankPaymentGateway: IBankPaymentGateway,
    private readonly resolveBankIntegrationCredentials: ResolveBankIntegrationCredentials,
  ) {}

  public async execute(input: IssueBankPaymentInputDto): Promise<IssueBankPaymentOutputDto> {
    const credentials = await this.resolveBankIntegrationCredentials.execute(input.bankId);
    return this.bankPaymentGateway.issue({ ...input, credentials });
  }
}
