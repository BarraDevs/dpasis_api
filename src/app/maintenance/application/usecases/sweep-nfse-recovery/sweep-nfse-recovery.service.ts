import { Inject, Injectable } from '@nestjs/common';
import type { INfseOutboxDao } from 'src/app/tax-invoice/nfse/application/persistence/dao/nfse-outbox-dao.interface';
import type { INfseDao } from 'src/app/tax-invoice/nfse/application/persistence/dao/nfse-dao.interface';
import type { INfseQueueProducer } from 'src/app/tax-invoice/nfse/application/queue/nfse-queue-producer.interface';
import { TOKENS } from 'src/core/di/token';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';

/**
 * Idade mínima de uma linha de outbox para ser considerada perdida. O despacho normal acontece
 * milissegundos depois do commit; um minuto separa "ainda em voo" de "ninguém enfileirou".
 */
const OUTBOX_MIN_AGE_IN_SECONDS = 60;

/** Teto por varredura em todas as consultas: recuperação é fluxo de fundo, não pico de carga. */
const SWEEP_LIMIT = 200;

/**
 * Idade mínima para cobrar confirmação da cobrança ao provedor. A emissão é assíncrona do lado do
 * Inter e leva alguns instantes; perguntar antes disso só gera consulta inútil.
 */
const BANK_PAYMENT_CONFIRMATION_MIN_AGE_IN_MINUTES = 10;

/**
 * Quanto tempo uma nota reivindicada para retentativa do boleto fica fora da varredura. Cobre o job
 * inteiro com folga: se ele falhar de novo, grava a data do degrau seguinte por cima do lease; se
 * nunca chegar a rodar — Redis fora, worker morto —, a nota volta quando o lease vencer.
 */
const BANK_PAYMENT_RETRY_LEASE_IN_MS = 15 * 60_000;

/** Teto baixo: cada item vira um GET no Inter, na mesma cota de 120/min da emissão e da confirmação. */
const BANK_PAYMENT_SETTLEMENT_SWEEP_LIMIT = 20;
const BANK_PAYMENT_SETTLEMENT_LEASE_IN_MS = 15 * 60_000;

/**
 * Recoloca em movimento tudo que ficou parado. As três varreduras cobrem as três janelas em que o
 * estado é gravado e o job seguinte é enfileirado em seguida, sem atomicidade — se o processo morre
 * no meio, é aqui que a nota volta a andar.
 *
 * Nenhuma delas faz chamada externa: todas só enfileiram. Assim uma prefeitura fora do ar não
 * segura o cron, e o retry/backoff de cada job continua sendo o da fila.
 */
@Injectable()
export class SweepNfseRecovery {
  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    @Inject(TOKENS.NfseDao) private readonly nfseDao: INfseDao,
    @Inject(TOKENS.NfseOutboxDao) private readonly nfseOutboxDao: INfseOutboxDao,
    @Inject(TOKENS.NfseRepository) private readonly nfseRepository: INfseRepositoryRecovery,
    @Inject(TOKENS.NfseQueueProducer) private readonly queueProducer: INfseQueueProducer,
  ) {}

  /**
   * Outbox: a intenção de despachar foi gravada na transação que criou a NFS-e, mas o job nunca
   * entrou no Redis. Reenfileirar é seguro porque todo handler tem guarda própria de estado
   * (`canSubmitToProvider`, `canPoll`, `hasBankPayment`).
   */
  public async sweepOutbox(): Promise<number> {
    const rows = await this.nfseOutboxDao.findUndispatched(OUTBOX_MIN_AGE_IN_SECONDS, SWEEP_LIMIT);

    for (const row of rows) {
      await this.dispatch(row.jobName, row.nfseId);
      await this.nfseRepository.markOutboxDispatched(row.id);
    }

    this.log('sweepOutbox', rows.length);
    return rows.length;
  }

  /** Notas não terminais com consulta ao provedor vencida. */
  public async sweepReconciliation(): Promise<number> {
    const targets = await this.nfseDao.findPendingReconciliation(SWEEP_LIMIT);

    for (const target of targets) {
      await this.queueProducer.addReconcileNfseJob({ nfseId: target.id });
    }

    this.log('sweepReconciliation', targets.length);
    return targets.length;
  }

  /**
   * `ISSUED` sem cobrança e sem falha registrada: o job de boleto nunca rodou. É a terceira janela
   * do P1-02 — entre `markIssued` e `addIssueBankPaymentJob` —, que o outbox não cobre porque a
   * linha só é gravada na criação da NFS-e.
   */
  public async sweepMissingBankPayment(): Promise<number> {
    const targets = await this.nfseDao.findIssuedWithoutBankPaymentJob(SWEEP_LIMIT);

    for (const target of targets) {
      await this.queueProducer.addIssueBankPaymentJob({ nfseId: target.id });
    }

    this.log('sweepMissingBankPayment', targets.length);
    return targets.length;
  }

  /**
   * Boleto com falha transitória e retentativa vencida. Diferente das outras varreduras, esta
   * reivindica cada nota antes de enfileirar: o `UPDATE` condicional só passa para uma réplica e
   * empurra a data para frente, então a mesma nota não volta à fila a cada cinco minutos enquanto a
   * rodada anterior ainda não terminou.
   */
  public async sweepBankPaymentRetry(): Promise<number> {
    const targets = await this.nfseDao.findBankPaymentRetryDue(SWEEP_LIMIT);
    let enqueued = 0;

    for (const target of targets) {
      const now = new Date();
      const claimed = await this.nfseRepository.claimBankPaymentRetry(
        target.id,
        now,
        new Date(now.getTime() + BANK_PAYMENT_RETRY_LEASE_IN_MS),
      );
      if (!claimed) {
        continue;
      }

      await this.queueProducer.addIssueBankPaymentJob({ nfseId: target.id });
      enqueued += 1;
    }

    this.log('sweepBankPaymentRetry', enqueued);
    return enqueued;
  }

  /** Cobranças solicitadas e ainda não confirmadas pelo provedor (P1-08). */
  public async sweepBankPaymentConfirmation(): Promise<number> {
    const targets = await this.nfseDao.findBankPaymentUnconfirmed(
      BANK_PAYMENT_CONFIRMATION_MIN_AGE_IN_MINUTES,
      SWEEP_LIMIT,
    );

    for (const target of targets) {
      await this.queueProducer.addConfirmBankPaymentJob({ nfseId: target.id });
    }

    this.log('sweepBankPaymentConfirmation', targets.length);
    return targets.length;
  }

  /**
   * Cobranças confirmadas ainda em aberto. O webhook é o caminho rápido; esta varredura cobre o
   * callback que o Inter desistiu de reenviar.
   */
  public async sweepBankPaymentSettlement(): Promise<number> {
    const targets = await this.nfseDao.findBankPaymentSettlementDue(BANK_PAYMENT_SETTLEMENT_SWEEP_LIMIT);
    let enqueued = 0;

    for (const target of targets) {
      const now = new Date();
      const claimed = await this.nfseRepository.claimBankPaymentSettlement(
        target.id,
        now,
        new Date(now.getTime() + BANK_PAYMENT_SETTLEMENT_LEASE_IN_MS),
      );
      if (!claimed) {
        continue;
      }

      await this.queueProducer.addSettleBankPaymentJob({ nfseId: target.id });
      enqueued += 1;
    }

    this.log('sweepBankPaymentSettlement', enqueued);
    return enqueued;
  }

  private async dispatch(jobName: string, nfseId: number): Promise<void> {
    switch (jobName) {
      case JobName.IssueNfseBatch:
        return this.queueProducer.addIssueBatchJob({ nfseId });
      case JobName.PollNfseBatch:
        return this.queueProducer.addPollBatchJob({ nfseId, attempt: 1 });
      case JobName.IssueNfseBankPayment:
        return this.queueProducer.addIssueBankPaymentJob({ nfseId });
      default:
        // Linha de outbox com job desconhecido não pode travar a varredura: a nota ainda tem a
        // reconciliação como rede de segurança, e a linha fica marcada para não voltar toda volta.
        this.logger.error(LogContext.NFS_GENERATION, {
          adapter: 'nfse',
          action: 'sweepOutbox',
          nfseId,
          errorMessage: `Job desconhecido no outbox: ${jobName}`,
        });
        return undefined;
    }
  }

  private log(action: string, count: number): void {
    if (count === 0) {
      return;
    }

    this.logger.debug(LogContext.NFS_GENERATION, {
      adapter: 'nfse',
      action,
      reason: `${count} nota(s) reenfileirada(s)`,
    });
  }
}

/** Só o que a varredura usa do repositório — evita arrastar a porta inteira para cá. */
type INfseRepositoryRecovery = {
  markOutboxDispatched(outboxId: number): Promise<void>;
  claimBankPaymentRetry(nfseId: number, now: Date, leaseUntil: Date): Promise<boolean>;
  claimBankPaymentSettlement(nfseId: number, now: Date, leaseUntil: Date): Promise<boolean>;
};
