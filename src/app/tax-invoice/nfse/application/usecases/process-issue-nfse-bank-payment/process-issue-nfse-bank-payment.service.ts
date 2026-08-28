import { Inject, Injectable } from '@nestjs/common';
import { IssueBankPayment } from 'src/app/bank-payment/application/usecases/issue-bank-payment/issue-bank-payment.service';
import { FindClientInvoiceConfigByClientId } from 'src/app/client/client-invoice-config/application/usecases/find-client-invoice-config-by-client-id/find-client-invoice-config-by-client-id.service';
import { ClientInvoiceConfigNotFoundError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { AppException } from 'src/core/filters/app.exception';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseToIssueBankPaymentMapper } from '../../mappers/nfse-to-issue-bank-payment.mapper';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import type { NfseBankPaymentSnapshot, NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ProcessIssueNfseBankPaymentInputDto } from './dtos/process-issue-nfse-bank-payment.dto';
import { DateTime } from 'luxon';

@Injectable()
export class ProcessIssueNfseBankPayment {
  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    @Inject(TOKENS.NfseRepository) private readonly nfseRepository: INfseRepository,
    private readonly issueBankPayment: IssueBankPayment,
    private readonly findClientInvoiceConfigByClientId: FindClientInvoiceConfigByClientId,
  ) {}

  public async execute(input: ProcessIssueNfseBankPaymentInputDto): Promise<void> {
    const nfse = await this.nfseRepository.findById(input.nfseId);
    if (!nfse) {
      throw new NfseNotFoundError();
    }
    if (!nfse.isIssued()) {
      return;
    }
    if (nfse.hasBankPayment()) {
      return;
    }

    const snapshot = nfse.props.data as unknown as NfseIssueSnapshot;
    let bankPayment = snapshot.bankPayment;

    if (!bankPayment) {
      try {
        bankPayment = await this.loadBankPaymentFallback(nfse.props.clientId);
      }
      catch (error: unknown) {
        this.logger.error(LogContext.BANK_PAYMENT, {
          adapter: 'nfse',
          action: 'processIssueNfseBankPayment',
          error,
        });
        return;
      }
    }

    let issueInput;
    try {
      issueInput = NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
        nfseId: nfse.props.id,
        issuedAt: nfse.props.issuedAt ?? new Date(),
        snapshot,
        bankPayment,
      });
    }
    catch (error: unknown) {
      this.logger.error(LogContext.BANK_PAYMENT, {
        adapter: 'nfse',
        action: 'processIssueNfseBankPayment',
        error,
      });
      return;
    }

    const result = await this.issueBankPayment.execute(issueInput);

    nfse.linkBankPayment(result.provider, result.requestCode);
    await this.nfseRepository.edit(nfse);
  }

  private async loadBankPaymentFallback(clientId: number): Promise<NfseBankPaymentSnapshot> {
    try {
      const invoiceConfig = await this.findClientInvoiceConfigByClientId.execute(clientId);
      const nowInSp = DateTime.now().setZone('America/Sao_Paulo');
      return {
        invoiceType: invoiceConfig.type,
        dueDateType: invoiceConfig.dueDateType,
        dueDateDay: invoiceConfig.dueDateDay,
        dueMonth: invoiceConfig.dueMonth,
        deadlineDays: invoiceConfig.deadlineDays,
        referenceMonth: nowInSp.month,
        referenceYear: nowInSp.year,
      };
    }
    catch (error: unknown) {
      if (error instanceof ClientInvoiceConfigNotFoundError) {
        throw new AppException('Configuração de faturamento do cliente ausente para emissão do boleto.');
      }
      throw error;
    }
  }
}
