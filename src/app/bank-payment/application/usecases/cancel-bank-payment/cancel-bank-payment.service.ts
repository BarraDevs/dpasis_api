import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { CancelBankPaymentInputDto } from './dtos/cancel-bank-payment.dto';

@Injectable()
export class CancelBankPayment {
  constructor(
    @Inject(TOKENS.BankPaymentGateway) private readonly bankPaymentGateway: IBankPaymentGateway,
  ) {}

  public async execute(requestCode: string, input: CancelBankPaymentInputDto): Promise<SuccessMessage> {
    await this.bankPaymentGateway.cancel({
      provider: input.provider,
      requestCode,
      reason: input.reason,
    });

    return { message: 'Cobrança bancária cancelada com sucesso.' };
  }
}
