import { timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { SettleNfseBankPayment } from 'src/app/tax-invoice/nfse/application/usecases/settle-nfse-bank-payment/settle-nfse-bank-payment.service';
import { ConfigService } from 'src/core/config/config.service';
import { InterWebhookNotConfiguredError } from '../../../domain/errors/inter-webhook-not-configured.error';
import { InvalidInterWebhookTokenError } from '../../../domain/errors/invalid-inter-webhook-token.error';
import { ReceiveInterCobrancaWebhookOutputDto } from './dtos/receive-inter-cobranca-webhook.dto';
import { extractInterCobrancaRequestCodes } from './extract-inter-cobranca-request-codes';

@Injectable()
export class ReceiveInterCobrancaWebhook {
  constructor(
    private readonly config: ConfigService,
    private readonly settleNfseBankPayment: SettleNfseBankPayment,
  ) {}

  public async execute(token: string, body: unknown): Promise<ReceiveInterCobrancaWebhookOutputDto> {
    this.assertToken(token);

    const requestCodes = extractInterCobrancaRequestCodes(body);
    for (const requestCode of requestCodes) {
      await this.settleNfseBankPayment.execute({ requestCode });
    }

    return { processed: requestCodes.length };
  }

  private assertToken(received: string): void {
    const expected = this.config.interWebhookToken;
    if (!expected) {
      throw new InterWebhookNotConfiguredError();
    }

    if (!this.safeEqual(received, expected)) {
      throw new InvalidInterWebhookTokenError();
    }
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  }
}
