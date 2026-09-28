import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { BankNotFoundError } from '../../../domain/errors/bank-not-found.error';
import { generateWebhookToken, hashWebhookToken } from '../../helpers/bank-integration-secret.helper';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';
import { RotateBankWebhookTokenOutputDto } from './dtos/rotate-bank-webhook-token.dto';

@Injectable()
export class RotateBankWebhookToken {
  constructor(
    @Inject(TOKENS.BankDao) private readonly dao: IBankDao,
  ) {}

  public async execute(id: number): Promise<RotateBankWebhookTokenOutputDto> {
    const bank = await this.dao.findById(id);
    if (!bank) {
      throw new BankNotFoundError();
    }

    const webhookToken = generateWebhookToken();
    await this.dao.updateIntegration(id, {
      webhookTokenHash: hashWebhookToken(webhookToken),
    });

    return { webhookToken };
  }
}
