import { Inject, Injectable } from '@nestjs/common';
import { ResolveBankIntegrationCredentials } from 'src/app/global/bank/application/usecases/resolve-bank-integration-credentials/resolve-bank-integration-credentials.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { CancelBankPaymentInputDto } from './dtos/cancel-bank-payment.dto';

@Injectable()
export class CancelBankPayment {
  constructor(
    @Inject(TOKENS.BankPaymentGateway) private readonly bankPaymentGateway: IBankPaymentGateway,
    private readonly resolveBankIntegrationCredentials: ResolveBankIntegrationCredentials,
  ) {}

  public async execute(requestCode: string, input: CancelBankPaymentInputDto): Promise<SuccessMessage> {
    const credentials = await this.resolveBankIntegrationCredentials.execute(input.bankId);
    await this.bankPaymentGateway.cancel({
      provider: input.provider,
      requestCode,
      reason: input.reason,
      credentials,
    });

    return { message: 'Cobrança bancária cancelada com sucesso.' };
  }
}
