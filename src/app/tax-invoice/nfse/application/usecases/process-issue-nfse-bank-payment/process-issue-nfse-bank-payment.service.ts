import { Inject, Injectable } from '@nestjs/common';
import { FindBankPaymentByYourNumber } from 'src/app/bank-payment/application/usecases/find-bank-payment-by-your-number/find-bank-payment-by-your-number.service';
import { FindBankPayment } from 'src/app/bank-payment/application/usecases/find-bank-payment/find-bank-payment.service';
import { IssueBankPaymentOutputDto } from 'src/app/bank-payment/application/usecases/issue-bank-payment/dtos/issue-bank-payment.dto';
import { IssueBankPayment } from 'src/app/bank-payment/application/usecases/issue-bank-payment/issue-bank-payment.service';
import { FindClientInvoiceConfigByClientId } from 'src/app/client/client-invoice-config/application/usecases/find-client-invoice-config-by-client-id/find-client-invoice-config-by-client-id.service';
import { ClientInvoiceConfigNotFoundError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-not-found.error';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { TOKENS } from 'src/core/di/token';
import { AppException } from 'src/core/filters/app.exception';
import { PermanentProviderError } from 'src/shared/errors/permanent-provider.error';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentAlreadyExistsError } from 'src/infra/bank-payment/errors/bank-payment-already-exists.error';
import { IssueBankPaymentInputDto } from 'src/infra/bank-payment/dtos/issue-bank-payment.dto';
import { Nfse } from '../../../domain/entities/nfse.entity';
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
    private readonly findBankPaymentByYourNumber: FindBankPaymentByYourNumber,
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
      throw await this.failBankPayment(
        nfse,
        'NFS-e emitida sem data de emissão; não é possível calcular o vencimento do boleto.',
      );
    }

    const snapshot = nfse.props.data as unknown as NfseIssueSnapshot;
    let bankPayment = snapshot.bankPayment;

    if (!bankPayment) {
      try {
        bankPayment = await this.loadBankPaymentFallback(nfse.props.clientId, issuedAt);
      }
      catch (error: unknown) {
        throw await this.failBankPayment(nfse, this.resolveErrorMessage(error), error);
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
      throw await this.failBankPayment(nfse, this.resolveErrorMessage(error), error);
    }

    // Uma tentativa anterior já chegou ao provedor: consultar antes de repetir o POST. É o que
    // protege os caminhos de conserto (retry manual, DLQ, retomada de fila), que sempre acontecem
    // fora da janela de idempotência implícita de 30 minutos do Inter — lá, sem consulta, o
    // segundo POST é um segundo boleto de verdade.
    if (nfse.hasRequestedBankPayment()) {
      const existing = await this.findBankPaymentByYourNumber.execute({
        provider: BankPaymentProvider.INTER,
        yourNumber: issueInput.yourNumber,
        amount: issueInput.amount,
        dueDate: issueInput.dueDate,
      });

      if (existing) {
        return this.linkExisting(nfse, { provider: existing.provider, requestCode: existing.requestCode });
      }
    }
    else {
      // A intenção é gravada ANTES da chamada. Se o processo morrer no meio, a tentativa seguinte
      // encontra esta marca e consulta em vez de emitir às cegas.
      nfse.markBankPaymentRequested(`nfse-${nfse.props.id}`);
      await this.nfseRepository.edit(nfse);
    }

    let result: IssueBankPaymentOutputDto;
    try {
      result = await this.issueBankPayment.execute(issueInput);
    }
    catch (error: unknown) {
      if (error instanceof BankPaymentAlreadyExistsError) {
        result = await this.resolveExistingBankPayment(error, nfse.props.id, issueInput);
        return this.linkExisting(nfse, result);
      }

      // Relança o erro original, não o `PermanentProviderError` da gravação: só ele carrega a
      // classificação transitório × permanente feita pelo adapter do provedor, e é ela que decide
      // se a fila retenta ou desiste.
      await this.failBankPayment(nfse, this.resolveErrorMessage(error), error);
      throw error;
    }

    return this.linkExisting(nfse, result);
  }

  private async linkExisting(nfse: Nfse, result: IssueBankPaymentOutputDto): Promise<IssueBankPaymentOutputDto> {
    nfse.linkBankPayment(result.provider, result.requestCode);
    await this.nfseRepository.edit(nfse);
    return result;
  }

  /**
   * Grava o motivo e devolve o erro para quem chama **lançar**. Antes estes caminhos devolviam
   * `null`: o job completava com sucesso, `removeOnComplete` apagava o rastro e a NFS-e ficava
   * `ISSUED` sem boleto, sem job e sem nada no Bull Board. Como são falhas determinísticas — dados
   * inválidos, configuração ausente —, o erro é `PermanentProviderError`, que o consumer converte em
   * `UnrecoverableError`: falha na hora, fica retida 30 dias e aparece para quem for investigar,
   * sem queimar as cinco tentativas.
   */
  private async failBankPayment(nfse: Nfse, message: string, error?: unknown): Promise<PermanentProviderError> {
    this.logger.error(LogContext.BANK_PAYMENT, {
      adapter: 'nfse',
      action: 'processIssueNfseBankPayment',
      nfseId: nfse.props.id,
      error: error ?? new AppException(message),
    });

    nfse.markBankPaymentFailed(message);
    await this.nfseRepository.edit(nfse);

    return new PermanentProviderError(message);
  }

  private resolveErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Erro desconhecido ao emitir o boleto.';
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
    expected: IssueBankPaymentInputDto,
  ): Promise<IssueBankPaymentOutputDto> {
    const existing = await this.findBankPayment.execute(error.requestCode, BankPaymentProvider.INTER);

    // Os três campos que formam a chave implícita do Inter junto com o pagador. Conferir só o
    // `seuNumero` deixaria passar uma cobrança de outro valor ou vencimento para a mesma NFS-e.
    const matches = existing.yourNumber === expected.yourNumber
      && existing.amount === expected.amount
      && existing.dueDate === expected.dueDate;

    if (!matches) {
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
