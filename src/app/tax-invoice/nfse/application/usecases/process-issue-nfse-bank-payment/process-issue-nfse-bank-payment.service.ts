import { Inject, Injectable } from '@nestjs/common';
import { IssueBankPaymentOutputDto } from 'src/app/bank-payment/application/usecases/issue-bank-payment/dtos/issue-bank-payment.dto';
import { IssueBankPayment } from 'src/app/bank-payment/application/usecases/issue-bank-payment/issue-bank-payment.service';
import { ClientInvoiceConfigDto } from 'src/app/client/client-invoice-config/application/dtos/client-invoice-config.dto';
import { FindClientInvoiceConfigByClientId } from 'src/app/client/client-invoice-config/application/usecases/find-client-invoice-config-by-client-id/find-client-invoice-config-by-client-id.service';
import { ClientInvoiceConfigNotFoundError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-not-found.error';
import { bankChargesFromDto } from 'src/app/global/bank/application/mappers/to-bank.dto';
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

  public async execute(input: ProcessIssueNfseBankPaymentInputDto): Promise<IssueBankPaymentOutputDto | null> {
    const nfse = await this.nfseRepository.findById(input.nfseId);
    if (!nfse) {
      throw new NfseNotFoundError();
    }
    if (!nfse.isIssued()) {
      return null;
    }
    if (nfse.hasBankPayment()) {
      return null;
    }

    const snapshot = nfse.props.data as unknown as NfseIssueSnapshot;
    let bankPayment = snapshot.bankPayment;
    let fineRate: number | null = null;
    let moraRate: number | null = null;

    try {
      const invoiceConfig = await this.findClientInvoiceConfigByClientId.execute(nfse.props.clientId);
      if (!invoiceConfig) {
        throw new ClientInvoiceConfigNotFoundError();
      }
      const charges = bankChargesFromDto(invoiceConfig.bank);
      fineRate = charges.fineRate;
      moraRate = charges.moraRate;
      if (!bankPayment) {
        bankPayment = this.toBankPaymentSnapshot(invoiceConfig);
      }
    }
    catch (error: unknown) {
      if (bankPayment && error instanceof ClientInvoiceConfigNotFoundError) {
        // snapshot already has calendar; emit without bank charges
      }
      else {
        this.logger.error(LogContext.BANK_PAYMENT, {
          adapter: 'nfse',
          action: 'processIssueNfseBankPayment',
          error: error instanceof ClientInvoiceConfigNotFoundError
            ? new AppException('Configuração de faturamento do cliente ausente para emissão do boleto.')
            : error,
        });
        return null;
      }
    }

    let issueInput;
    try {
      issueInput = NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
        nfseId: nfse.props.id,
        issuedAt: nfse.props.issuedAt ?? new Date(),
        snapshot,
        bankPayment,
        fineRate,
        moraRate,
      });
    }
    catch (error: unknown) {
      this.logger.error(LogContext.BANK_PAYMENT, {
        adapter: 'nfse',
        action: 'processIssueNfseBankPayment',
        error,
      });
      return null;
    }

    const result = await this.issueBankPayment.execute(issueInput);

    nfse.linkBankPayment(result.provider, result.requestCode);
    await this.nfseRepository.edit(nfse);

    return result;
  }

  private toBankPaymentSnapshot(invoiceConfig: ClientInvoiceConfigDto): NfseBankPaymentSnapshot {
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
}
