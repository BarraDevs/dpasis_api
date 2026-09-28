import { Inject, Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { TOKENS } from 'src/core/di/token';
import { hashWebhookToken } from '../../helpers/bank-integration-secret.helper';
import type { BankIntegrationRecord, IBankDao } from '../../persistence/dao/bank-dao.interface';

@Injectable()
export class FindBankByWebhookToken {
  constructor(
    @Inject(TOKENS.BankDao) private readonly dao: IBankDao,
  ) {}

  public async execute(token: string): Promise<BankIntegrationRecord | null> {
    const trimmed = token?.trim();
    if (!trimmed) {
      return null;
    }

    const hash = hashWebhookToken(trimmed);
    const bank = await this.dao.findByWebhookTokenHash(hash);
    if (!bank?.webhookTokenHash) {
      return null;
    }

    const stored = Buffer.from(bank.webhookTokenHash);
    const computed = Buffer.from(hash);
    if (stored.length !== computed.length || !timingSafeEqual(stored, computed)) {
      return null;
    }

    return bank;
  }
}
