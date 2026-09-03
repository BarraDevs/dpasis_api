import { Inject, Injectable } from '@nestjs/common';
import { IssueBankPaymentOutputDto } from 'src/app/bank-payment/application/usecases/issue-bank-payment/dtos/issue-bank-payment.dto';
import { FindBankPayment } from 'src/app/bank-payment/application/usecases/find-bank-payment/find-bank-payment.service';
import { IssueBankPayment } from 'src/app/bank-payment/application/usecases/issue-bank-payment/issue-bank-payment.service';
import { FindClientInvoiceConfigByClientId } from 'src/app/client/client-invoice-config/application/usecases/find-client-invoice-config-by-client-id/find-client-invoice-config-by-client-id.service';
import { ClientInvoiceConfigNotFoundError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-not-found.error';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { TOKENS } from 'src/core/di/token';
import { AppException } from 'src/core/filters/app.exception';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentAlreadyExistsError } from 'src/infra/bank-payment/errors/bank-payment-already-exists.error';
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
    private readonly findBankPayment: FindBankPayment,
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

    // `isIssued()` garante que `markIssued` já rodou, então `issuedAt` está preenchido. Um fallback
    // para `new Date()` aqui tornaria `dataVencimento` diferente a cada tentativa e derrubaria a
    // idempotência de 30 minutos do Inter justamente quando ela mais importa.
    const issuedAt = nfse.props.issuedAt;
    if (!issuedAt) {
      this.logger.error(LogContext.BANK_PAYMENT, {
        adapter: 'nfse',
        action: 'processIssueNfseBankPayment',
        nfseId: nfse.props.id,
        error: new AppException('NFS-e emitida sem data de emissão; não é possível calcular o vencimento do boleto.'),
      });
      return null;
    }

    const snapshot = nfse.props.data as unknown as NfseIssueSnapshot;
    let bankPayment = snapshot.bankPayment;

    if (!bankPayment) {
      try {
        bankPayment = await this.loadBankPaymentFallback(nfse.props.clientId, issuedAt);
      }
      catch (error: unknown) {
        this.logger.error(LogContext.BANK_PAYMENT, {
          adapter: 'nfse',
          action: 'processIssueNfseBankPayment',
          nfseId: nfse.props.id,
          error,
        });
        return null;
      }
    }

    let issueInput;
    try {
      issueInput = NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
        nfseId: nfse.props.id,
        issuedAt,
        snapshot,
        bankPayment,
      });
    }
    catch (error: unknown) {
      this.logger.error(LogContext.BANK_PAYMENT, {
        adapter: 'nfse',
        action: 'processIssueNfseBankPayment',
        nfseId: nfse.props.id,
        error,
      });
      return null;
    }

    let result: IssueBankPaymentOutputDto;
    try {
      result = await this.issueBankPayment.execute(issueInput);
    }
    catch (error: unknown) {
      if (!(error instanceof BankPaymentAlreadyExistsError)) {
        throw error;
      }
      result = await this.resolveExistingBankPayment(error, nfse.props.id, issueInput.yourNumber);
    }

    nfse.linkBankPayment(result.provider, result.requestCode);
    await this.nfseRepository.edit(nfse);

    return result;
  }

  /**
   * O provedor recusou porque a cobrança já existe e devolveu o identificador dela. Sem este
   * caminho o job morreria com erro permanente **depois** de o boleto ter sido criado, deixando uma
   * cobrança viva e cobrável sem nenhum vínculo local — pior que a duplicidade, porque ninguém sabe
   * que ela existe.
   *
   * A mensagem do provedor é prosa, não contrato: confirmar por consulta antes de vincular.
   */
  private async resolveExistingBankPayment(
    error: BankPaymentAlreadyExistsError,
    nfseId: number,
    expectedYourNumber: string,
  ): Promise<IssueBankPaymentOutputDto> {
    const existing = await this.findBankPayment.execute(error.requestCode, BankPaymentProvider.INTER);

    if (existing.yourNumber !== expectedYourNumber) {
      throw error;
    }

    this.logger.error(LogContext.BANK_PAYMENT, {
      adapter: 'nfse',
      action: 'processIssueNfseBankPayment',
      nfseId,
      requestCode: error.requestCode,
      error,
    });

    return { provider: existing.provider, requestCode: existing.requestCode };
  }

  /**
   * A competência sai da data de emissão da nota, não de `now()`: derivar do relógio faria uma
   * retentativa que cruza a virada do mês calcular outro vencimento, abrindo uma chave de
   * idempotência nova no Inter e emitindo um segundo boleto.
   */
  private async loadBankPaymentFallback(clientId: number, issuedAt: Date): Promise<NfseBankPaymentSnapshot> {
    try {
      const invoiceConfig = await this.findClientInvoiceConfigByClientId.execute(clientId);
      const issuedAtInSp = DateTime.fromJSDate(issuedAt).setZone(SAO_PAULO_TIMEZONE);
      return {
        invoiceType: invoiceConfig.type,
        dueDateType: invoiceConfig.dueDateType,
        dueDateDay: invoiceConfig.dueDateDay,
        dueMonth: invoiceConfig.dueMonth,
        deadlineDays: invoiceConfig.deadlineDays,
        referenceMonth: issuedAtInSp.month,
        referenceYear: issuedAtInSp.year,
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
