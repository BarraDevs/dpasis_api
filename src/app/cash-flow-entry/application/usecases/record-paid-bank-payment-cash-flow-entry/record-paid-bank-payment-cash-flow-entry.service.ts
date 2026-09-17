import { Inject, Injectable } from '@nestjs/common';
import { CashFlowEntryOrigin } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-origin.enum';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { TOKENS } from 'src/core/di/token';
import type { ICashFlowEntryDao } from '../../persistence/dao/cash-flow-entry-dao.interface';
import {
  RecordPaidBankPaymentCashFlowEntryInputDto,
  RecordPaidBankPaymentCashFlowEntryOutputDto,
} from './dtos/record-paid-bank-payment-cash-flow-entry.dto';

@Injectable()
export class RecordPaidBankPaymentCashFlowEntry {
  constructor(
    @Inject(TOKENS.CashFlowEntryDao) private readonly dao: ICashFlowEntryDao,
  ) {}

  public async execute(
    input: RecordPaidBankPaymentCashFlowEntryInputDto,
  ): Promise<RecordPaidBankPaymentCashFlowEntryOutputDto> {
    const existing = await this.dao.findByNfseId(input.nfseId);
    if (existing) {
      return { id: existing.id };
    }

    if (input.amount == null) {
      return { id: null };
    }

    const id = await this.dao.save({
      companyId: input.companyId,
      type: CashFlowEntryType.CREDIT,
      origin: CashFlowEntryOrigin.BANK_PAYMENT,
      amountInCents: Math.round(input.amount * 100),
      occurredAt: input.occurredAt,
      description: `Pagamento de boleto NFS-e ${input.nfseId} (${input.bankPaymentRequestCode})`,
      nfseId: input.nfseId,
      bankPaymentRequestCode: input.bankPaymentRequestCode,
    });

    return { id };
  }
}
