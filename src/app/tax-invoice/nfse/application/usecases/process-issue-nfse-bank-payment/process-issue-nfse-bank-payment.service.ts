import { Inject, Injectable } from '@nestjs/common';
import { RecordJobAudit } from 'src/app/audit/application/usecases/record-job-audit/record-job-audit.service';
import { FindBankPaymentByYourNumber } from 'src/app/bank-payment/application/usecases/find-bank-payment-by-your-number/find-bank-payment-by-your-number.service';
import { FindBankPayment } from 'src/app/bank-payment/application/usecases/find-bank-payment/find-bank-payment.service';
import {
  IssueBankPaymentInputDto,
  IssueBankPaymentOutputDto,
} from 'src/app/bank-payment/application/usecases/issue-bank-payment/dtos/issue-bank-payment.dto';
import { IssueBankPayment } from 'src/app/bank-payment/application/usecases/issue-bank-payment/issue-bank-payment.service';
import { ClientInvoiceConfigDto } from 'src/app/client/client-invoice-config/application/dtos/client-invoice-config.dto';
import { FindClientInvoiceConfigByClientId } from 'src/app/client/client-invoice-config/application/usecases/find-client-invoice-config-by-client-id/find-client-invoice-config-by-client-id.service';
import { ClientInvoiceConfigNotFoundError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-not-found.error';
import { bankChargesFromDto } from 'src/app/global/bank/application/mappers/to-bank.dto';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { TOKENS } from 'src/core/di/token';
import { AppException } from 'src/core/filters/app.exception';
import { PermanentProviderError } from 'src/shared/errors/permanent-provider.error';
import { RetryScheduledError } from 'src/shared/errors/retry-scheduled.error';
import { TransientProviderError } from 'src/shared/errors/transient-provider.error';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { BankPaymentDto } from 'src/infra/bank-payment/dtos/bank-payment.dto';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { BankPaymentAlreadyExistsError } from 'src/infra/bank-payment/errors/bank-payment-already-exists.error';
import { Nfse } from '../../../domain/entities/nfse.entity';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseToIssueBankPaymentMapper } from '../../mappers/nfse-to-issue-bank-payment.mapper';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import type { NfseBankPaymentSnapshot, NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ProcessIssueNfseBankPaymentInputDto } from './dtos/process-issue-nfse-bank-payment.dto';
import { DateTime } from 'luxon';

/**
 * Escada da retentativa automática do boleto depois de falha transitória do provedor (Inter fora
 * do ar, 5xx, 429). Curta de propósito: a maioria das indisponibilidades se resolve em minutos, e o
 * teto de 24h (`BANK_PAYMENT_RETRY_WINDOW_MS`) faz uma falha longa virar alerta e decisão humana no
 * mesmo dia, em vez de continuar tentando em silêncio. Depois do último degrau, repete 6h até o teto.
 */
const BANK_PAYMENT_RETRY_DELAYS_MS = [
  300_000, // 5min
  900_000, // 15min
  1_800_000, // 30min
  3_600_000, // 1h
  7_200_000, // 2h
  14_400_000, // 4h
  21_600_000, // 6h
];

/** Janela da retentativa automática, contada da primeira solicitação ao provedor. */
const BANK_PAYMENT_RETRY_WINDOW_MS = 86_400_000;

@Injectable()
export class ProcessIssueNfseBankPayment {
  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    @Inject(TOKENS.NfseRepository) private readonly nfseRepository: INfseRepository,
    private readonly issueBankPayment: IssueBankPayment,
    private readonly findBankPayment: FindBankPayment,
    private readonly findBankPaymentByYourNumber: FindBankPaymentByYourNumber,
    private readonly findClientInvoiceConfigByClientId: FindClientInvoiceConfigByClientId,
    private readonly recordJobAudit: RecordJobAudit,
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
        bankPayment = this.toBankPaymentSnapshot(invoiceConfig, issuedAt);
      }
    }
    catch (error: unknown) {
      if (!(bankPayment && error instanceof ClientInvoiceConfigNotFoundError)) {
        const wrapped = error instanceof ClientInvoiceConfigNotFoundError
          ? new AppException('Configuração de faturamento do cliente ausente para emissão do boleto.')
          : error;
        throw await this.failBankPayment(nfse, this.resolveErrorMessage(wrapped), wrapped);
      }
    }

    let issueInput: IssueBankPaymentInputDto;
    try {
      issueInput = NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
        nfseId: nfse.props.id,
        issuedAt,
        snapshot,
        bankPayment,
        fineRate,
        moraRate,
      });
    }
    catch (error: unknown) {
      throw await this.failBankPayment(nfse, this.resolveErrorMessage(error), error);
    }

    // A intenção é gravada ANTES da chamada. Se o processo morrer no meio, a tentativa seguinte
    // encontra esta marca e consulta em vez de emitir às cegas.
    const previouslyRequested = nfse.hasRequestedBankPayment();
    if (!previouslyRequested) {
      nfse.markBankPaymentRequested(`nfse-${nfse.props.id}`);
      await this.nfseRepository.edit(nfse);
    }

    let result: IssueBankPaymentOutputDto;
    try {
      result = await this.requestBankPayment(issueInput, previouslyRequested);
    }
    catch (error: unknown) {
      if (!(error instanceof BankPaymentAlreadyExistsError)) {
        throw await this.handleProviderFailure(nfse, error, issueInput.dueDate);
      }
      result = await this.resolveExistingBankPayment(nfse, error, issueInput);
    }

    return this.linkExisting(nfse, result);
  }

  /**
   * Uma tentativa anterior já chegou ao provedor: consultar antes de repetir o POST. É o que protege
   * os caminhos de conserto (retry manual, retentativa agendada, DLQ, retomada de fila), que sempre
   * acontecem fora da janela de idempotência implícita de 30 minutos do Inter — lá, sem consulta, o
   * segundo POST é um segundo boleto de verdade.
   */
  private async requestBankPayment(
    issueInput: IssueBankPaymentInputDto,
    previouslyRequested: boolean,
  ): Promise<IssueBankPaymentOutputDto> {
    if (previouslyRequested) {
      const existing = await this.findBankPaymentByYourNumber.execute({
        provider: BankPaymentProvider.INTER,
        yourNumber: issueInput.yourNumber,
        amount: issueInput.amount,
        dueDate: issueInput.dueDate,
      });

      if (existing) {
        return { provider: existing.provider, requestCode: existing.requestCode };
      }
    }

    return this.issueBankPayment.execute(issueInput);
  }

  private async linkExisting(nfse: Nfse, result: IssueBankPaymentOutputDto): Promise<IssueBankPaymentOutputDto> {
    nfse.linkBankPayment(result.provider, result.requestCode);
    await this.nfseRepository.edit(nfse);

    this.recordJobAudit.record({
      jobName: 'issue-nfse-bank-payment',
      nfseId: nfse.props.id,
      from: nfse.props.status,
      to: nfse.props.status,
      reason: `Cobrança ${result.requestCode} vinculada (${result.provider})`,
    });

    return result;
  }

  /**
   * Decide o que uma falha do provedor significa para a nota e devolve o erro que quem chama deve
   * lançar.
   *
   * - Transitória com a escada ainda aberta: grava o motivo, agenda a próxima rodada e devolve
   *   `RetryScheduledError`. A fila encerra o job; a varredura retoma no horário agendado.
   * - Qualquer outra — transitória com a janela esgotada, permanente, desconhecida: grava o motivo
   *   sem agendamento e devolve o erro **original**. Só ele carrega a classificação feita pelo
   *   adapter do provedor, e é ela que decide se o BullMQ ainda retenta ou desiste.
   */
  private async handleProviderFailure(nfse: Nfse, error: unknown, dueDate: string): Promise<unknown> {
    const message = this.resolveErrorMessage(error);

    if (error instanceof TransientProviderError) {
      const nextAttemptAt = this.nextRetryAt(nfse, dueDate, error.retryAfterSeconds);

      if (nextAttemptAt) {
        const scheduledMessage = `${message} Nova tentativa automática em `
          + `${ProcessIssueNfseBankPayment.formatInSaoPaulo(nextAttemptAt)}.`;
        await this.recordBankPaymentFailure(nfse, scheduledMessage, error, nextAttemptAt);
        return new RetryScheduledError(scheduledMessage, nextAttemptAt);
      }

      await this.recordBankPaymentFailure(
        nfse,
        `${message} Retentativa automática encerrada: conferir no provedor e emitir pelo retry manual.`,
        error,
        null,
      );
      return error;
    }

    await this.recordBankPaymentFailure(nfse, message, error, null);
    return error;
  }

  /**
   * Próxima rodada da escada, ou `null` quando ela passaria do menor entre os dois prazos: 24h desde
   * a primeira solicitação ao provedor e o último instante em que o Inter ainda aceita este
   * vencimento — ele é congelado a partir de `issuedAt`, então não anda junto com as tentativas.
   * `Retry-After` só adia o degrau, nunca o antecipa.
   */
  private nextRetryAt(nfse: Nfse, dueDate: string, retryAfterSeconds?: number): Date | null {
    const now = Date.now();
    const retryCount = nfse.props.bankPaymentRetryCount ?? 0;
    const step = BANK_PAYMENT_RETRY_DELAYS_MS[Math.min(retryCount, BANK_PAYMENT_RETRY_DELAYS_MS.length - 1)];
    const nextAttemptAt = now + Math.max(step, (retryAfterSeconds ?? 0) * 1000);

    const firstRequestedAt = nfse.props.bankPaymentRequestedAt?.getTime() ?? now;
    const deadline = Math.min(
      firstRequestedAt + BANK_PAYMENT_RETRY_WINDOW_MS,
      NfseToIssueBankPaymentMapper.issueDeadline(dueDate).getTime(),
    );

    return nextAttemptAt > deadline ? null : new Date(nextAttemptAt);
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
    await this.recordBankPaymentFailure(nfse, message, error, null);
    return new PermanentProviderError(message);
  }

  /**
   * Grava por que o boleto não saiu e se o sistema vai tentar de novo. `nextRetryAt` nulo é a marca
   * de "exige decisão humana" — é o que o alerta de cobrança com falha lista.
   */
  private async recordBankPaymentFailure(
    nfse: Nfse,
    message: string,
    error: unknown,
    nextRetryAt: Date | null,
  ): Promise<void> {
    this.logger.error(LogContext.BANK_PAYMENT, {
      adapter: 'nfse',
      action: 'processIssueNfseBankPayment',
      nfseId: nfse.props.id,
      error: error ?? new AppException(message),
    });

    nfse.markBankPaymentFailed(message);
    nfse.scheduleBankPaymentRetry(nextRetryAt);
    await this.nfseRepository.edit(nfse);

    this.recordJobAudit.record({
      jobName: 'issue-nfse-bank-payment',
      nfseId: nfse.props.id,
      from: nfse.props.status,
      to: nfse.props.status,
      reason: message,
      succeeded: false,
    });
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
   * A mensagem do provedor é prosa, não contrato: confirmar por consulta antes de vincular — e só
   * vincular o que de fato é a cobrança desta NFS-e e está de pé.
   */
  private async resolveExistingBankPayment(
    nfse: Nfse,
    error: BankPaymentAlreadyExistsError,
    expected: IssueBankPaymentInputDto,
  ): Promise<IssueBankPaymentOutputDto> {
    let existing: BankPaymentDto;
    try {
      existing = await this.findBankPayment.execute(error.requestCode, BankPaymentProvider.INTER);
    }
    catch (lookupError: unknown) {
      throw await this.handleProviderFailure(nfse, lookupError, expected.dueDate);
    }

    // Os três campos que formam a chave implícita do Inter junto com o pagador. Conferir só o
    // `seuNumero` deixaria passar uma cobrança de outro valor ou vencimento para a mesma NFS-e.
    const matches = existing.yourNumber === expected.yourNumber
      && existing.amount === expected.amount
      && existing.dueDate === expected.dueDate;

    if (!matches) {
      // Mesma chave para o Inter, dados diferentes para nós: vincular gravaria na NFS-e uma cobrança
      // de outro valor ou vencimento, e repetir o POST bate na mesma recusa. Antes o erro escapava
      // sem registro e a varredura de boleto faltante repetia o POST a cada cinco minutos.
      throw await this.failBankPayment(
        nfse,
        `Banco Inter recusou por duplicidade, mas a cobrança ${error.requestCode} não corresponde a esta `
        + 'NFS-e (seuNumero, valor ou vencimento divergentes).',
        error,
      );
    }

    if (existing.status === BankPaymentStatus.FAILED) {
      // Dentro da janela de 30 minutos o Inter devolve a chave da cobrança que ele mesmo não
      // conseguiu produzir. Vincular reabriria a `FALHA_EMISSAO` que a reemissão acabou de desfazer;
      // passada a janela, o mesmo POST cria uma cobrança nova. Esperar é transitório por definição.
      throw await this.handleProviderFailure(
        nfse,
        new TransientProviderError(
          `Cobrança ${error.requestCode} com falha de emissão ainda ocupa a chave de idempotência `
          + 'do Banco Inter (janela de 30 minutos).',
        ),
        expected.dueDate,
      );
    }

    this.logger.error(LogContext.BANK_PAYMENT, {
      adapter: 'nfse',
      action: 'processIssueNfseBankPayment',
      nfseId: nfse.props.id,
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
  private toBankPaymentSnapshot(invoiceConfig: ClientInvoiceConfigDto, issuedAt: Date): NfseBankPaymentSnapshot {
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

  private static formatInSaoPaulo(date: Date): string {
    return DateTime.fromJSDate(date).setZone(SAO_PAULO_TIMEZONE).toFormat('dd/MM/yyyy HH:mm');
  }
}
