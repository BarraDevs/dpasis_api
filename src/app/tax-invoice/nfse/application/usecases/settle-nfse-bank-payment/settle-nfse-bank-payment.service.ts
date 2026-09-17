import { Inject, Injectable } from '@nestjs/common';
import { RecordJobAudit } from 'src/app/audit/application/usecases/record-job-audit/record-job-audit.service';
import { FindBankPayment } from 'src/app/bank-payment/application/usecases/find-bank-payment/find-bank-payment.service';
import { RecordPaidBankPaymentCashFlowEntry } from 'src/app/cash-flow-entry/application/usecases/record-paid-bank-payment-cash-flow-entry/record-paid-bank-payment-cash-flow-entry.service';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { Nfse } from '../../../domain/entities/nfse.entity';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import { SettleNfseBankPaymentInputDto, SettleNfseBankPaymentOutputDto } from './dtos/settle-nfse-bank-payment.dto';

/** Próxima consulta de liquidação quando o GET ainda mostra a cobrança em aberto. */
const SETTLEMENT_RECHECK_MS = 6 * 60 * 60_000;

@Injectable()
export class SettleNfseBankPayment {
  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    @Inject(TOKENS.NfseRepository) private readonly nfseRepository: INfseRepository,
    private readonly findBankPayment: FindBankPayment,
    private readonly recordJobAudit: RecordJobAudit,
    private readonly recordPaidBankPaymentCashFlowEntry: RecordPaidBankPaymentCashFlowEntry,
  ) {}

  /**
   * Confirma a situação atual no Inter (GET) e grava pago/cancelado/expirado. O JSON do webhook
   * não é fonte de verdade: Bolepix não assina o body. Sem NFS-e local o callback é ignorado —
   * o Inter já conhece a cobrança, 200 evita as 4 retentativas.
   */
  public async execute(input: SettleNfseBankPaymentInputDto): Promise<SettleNfseBankPaymentOutputDto | null> {
    const nfse = await this.load(input);
    if (!nfse) {
      return null;
    }

    const requestCode = nfse.props.bankPaymentRequestCode;
    if (!requestCode) {
      return null;
    }

    if (nfse.hasSettledBankPayment()) {
      await this.recordPaidCashFlow(nfse, requestCode);
      return { nfseId: nfse.props.id, status: nfse.props.bankPaymentStatus ?? null, settled: true };
    }

    const provider = (nfse.props.bankPaymentProvider ?? BankPaymentProvider.INTER) as BankPaymentProvider;
    const bankPayment = await this.findBankPayment.execute(requestCode, provider);

    const settled = nfse.markBankPaymentSettlement(bankPayment.status, new Date());
    if (!settled) {
      nfse.scheduleBankPaymentSettlement(new Date(Date.now() + SETTLEMENT_RECHECK_MS));
    }

    await this.persist(nfse, requestCode, settled);
    if (settled) {
      await this.recordPaidCashFlow(nfse, requestCode, bankPayment.amount);
    }
    return { nfseId: nfse.props.id, status: bankPayment.status, settled };
  }

  private async recordPaidCashFlow(nfse: Nfse, requestCode: string, amount?: number): Promise<void> {
    if (!nfse.isPaidLikeBankPayment()) {
      return;
    }

    const recorded = await this.recordPaidBankPaymentCashFlowEntry.execute({
      companyId: nfse.props.companyId,
      nfseId: nfse.props.id,
      bankPaymentRequestCode: requestCode,
      occurredAt: nfse.props.bankPaymentSettledAt ?? new Date(),
      amount,
    });

    if (recorded.id != null || amount != null) {
      return;
    }

    const provider = (nfse.props.bankPaymentProvider ?? BankPaymentProvider.INTER) as BankPaymentProvider;
    const bankPayment = await this.findBankPayment.execute(requestCode, provider);
    await this.recordPaidBankPaymentCashFlowEntry.execute({
      companyId: nfse.props.companyId,
      nfseId: nfse.props.id,
      bankPaymentRequestCode: requestCode,
      occurredAt: nfse.props.bankPaymentSettledAt ?? new Date(),
      amount: bankPayment.amount,
    });
  }

  private async load(input: SettleNfseBankPaymentInputDto): Promise<Nfse | null> {
    if (input.nfseId != null) {
      const nfse = await this.nfseRepository.findById(input.nfseId);
      if (!nfse) {
        throw new NfseNotFoundError();
      }
      return nfse;
    }

    const requestCode = input.requestCode?.trim();
    if (!requestCode) {
      return null;
    }

    return this.nfseRepository.findByBankPaymentRequestCode(requestCode);
  }

  private async persist(nfse: Nfse, requestCode: string, settled: boolean): Promise<void> {
    await this.nfseRepository.edit(nfse);

    this.logger.debug(LogContext.BANK_PAYMENT, {
      adapter: 'nfse',
      action: 'settleNfseBankPayment',
      nfseId: nfse.props.id,
      requestCode,
    });

    this.recordJobAudit.record({
      jobName: 'settle-nfse-bank-payment',
      nfseId: nfse.props.id,
      from: null,
      to: nfse.props.bankPaymentStatus ?? '',
      reason: `Cobrança ${requestCode} · liquidada=${settled}`,
      succeeded: true,
    });
  }
}
