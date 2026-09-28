import { Inject, Injectable } from '@nestjs/common';
import { ResolveBankIntegrationCredentials } from 'src/app/global/bank/application/usecases/resolve-bank-integration-credentials/resolve-bank-integration-credentials.service';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { BankPaymentDto } from 'src/infra/bank-payment/dtos/bank-payment.dto';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';

@Injectable()
export class FindBankPayment {
  constructor(
    @Inject(TOKENS.BankPaymentGateway) private readonly bankPaymentGateway: IBankPaymentGateway,
    private readonly resolveBankIntegrationCredentials: ResolveBankIntegrationCredentials,
  ) {}

  public async execute(
    requestCode: string,
    provider: BankPaymentProvider,
    bankId: number,
  ): Promise<BankPaymentDto> {
    const credentials = await this.resolveBankIntegrationCredentials.execute(bankId);
    return this.bankPaymentGateway.find({ provider, requestCode, credentials });
  }
}
