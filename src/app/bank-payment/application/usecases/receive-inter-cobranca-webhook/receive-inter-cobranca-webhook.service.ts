import { Injectable } from '@nestjs/common';
import { FindBankByWebhookToken } from 'src/app/global/bank/application/usecases/find-bank-by-webhook-token/find-bank-by-webhook-token.service';
import { SettleNfseBankPayment } from 'src/app/tax-invoice/nfse/application/usecases/settle-nfse-bank-payment/settle-nfse-bank-payment.service';
import { InterWebhookNotConfiguredError } from '../../../domain/errors/inter-webhook-not-configured.error';
import { InvalidInterWebhookTokenError } from '../../../domain/errors/invalid-inter-webhook-token.error';
import { ReceiveInterCobrancaWebhookOutputDto } from './dtos/receive-inter-cobranca-webhook.dto';
import { extractInterCobrancaRequestCodes } from './extract-inter-cobranca-request-codes';

@Injectable()
export class ReceiveInterCobrancaWebhook {
  constructor(
    private readonly findBankByWebhookToken: FindBankByWebhookToken,
    private readonly settleNfseBankPayment: SettleNfseBankPayment,
  ) {}

  public async execute(token: string, body: unknown): Promise<ReceiveInterCobrancaWebhookOutputDto> {
    const bank = await this.findBankByWebhookToken.execute(token);
    if (!bank) {
      throw token?.trim()
        ? new InvalidInterWebhookTokenError()
        : new InterWebhookNotConfiguredError();
    }

    const requestCodes = extractInterCobrancaRequestCodes(body);
    for (const requestCode of requestCodes) {
      await this.settleNfseBankPayment.execute({ requestCode, bankId: bank.id });
    }

    return { processed: requestCodes.length };
  }
}
