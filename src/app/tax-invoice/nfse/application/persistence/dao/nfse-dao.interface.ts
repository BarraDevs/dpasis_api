import { NfseAlertRowDto, NfseDailyClosingDto } from '../../dtos/nfse-alert-row.dto';
import {
  NfseCountByKeyDto,
  NfseProviderCallStatsDto,
} from '../../usecases/get-nfse-metrics/dtos/get-nfse-metrics.dto';
import { NfseReconcileTargetDto } from '../../dtos/nfse-reconcile-target.dto';
import { NfseDto } from '../../dtos/nfse.dto';

export interface INfseDao {
  findById(id: number): Promise<NfseDto | null>;
  /** Não terminais (PENDING/SUBMITTED/PROCESSING) sem movimento há mais que o limiar. */
  findStuck(olderThanMinutes: number): Promise<NfseAlertRowDto[]>;
  /** Notas paradas esperando o provedor. A reconciliação por RPS é quem as resolve. */
  findAwaitingProvider(): Promise<NfseAlertRowDto[]>;
  /** Emitidas sem cobrança vinculada há mais que o limiar. */
  findIssuedWithoutBankPayment(olderThanMinutes: number): Promise<NfseAlertRowDto[]>;
  /**
   * Cobranças com falha que exigem decisão humana: produção recusada pelo provedor (P1-08) ou
   * emissão sem retentativa automática agendada. As que ainda têm retentativa ficam de fora.
   */
  findBankPaymentFailed(): Promise<NfseAlertRowDto[]>;
  /** Emitidas com ressalva do fisco (`A*`) sobre as quais a operação ainda não foi avisada. */
  findIssuedWithProviderAlerts(): Promise<NfseAlertRowDto[]>;
  /** Fechamento de um dia: quantas foram emitidas e quantas têm boleto. */
  countIssuedByDay(dayStart: Date, dayEnd: Date): Promise<NfseDailyClosingDto>;

  /** Notas não terminais com consulta ao provedor agendada para agora ou antes. */
  findPendingReconciliation(limit: number): Promise<NfseReconcileTargetDto[]>;
  /**
   * Notas não terminais criadas na janela, para a conciliação por período. Diferente da consulta
   * agendada: aqui a janela é a do provedor, não a do nosso relógio de retentativa.
   */
  findPendingByPeriod(periodStart: Date, periodEnd: Date): Promise<NfseReconcileTargetDto[]>;
  /**
   * `ISSUED` sem cobrança e sem falha registrada: o job de boleto nunca chegou a rodar. Fecha a
   * janela entre `markIssued` e `addIssueBankPaymentJob`, que o outbox não cobre.
   */
  findIssuedWithoutBankPaymentJob(limit: number): Promise<NfseReconcileTargetDto[]>;
  /**
   * `ISSUED` sem cobrança, com retentativa automática do boleto agendada para agora ou antes. É a
   * outra metade do boleto faltante: a nota cuja emissão falhou por motivo transitório e que a
   * varredura acima deixa de fora porque tem falha registrada.
   */
  findBankPaymentRetryDue(limit: number): Promise<NfseReconcileTargetDto[]>;
  /**
   * Cobranças solicitadas ao provedor e ainda não confirmadas. `POST /cobrancas` é assíncrono:
   * `codigoSolicitacao` diz que a solicitação foi aceita, não que o boleto existe.
   */
  findBankPaymentUnconfirmed(olderThanMinutes: number, limit: number): Promise<NfseReconcileTargetDto[]>;
  /**
   * Boletos confirmados ainda em aberto cuja consulta de liquidação venceu. É o fallback do
   * webhook Bolepix: o Inter desiste depois de 4 tentativas, e esta varredura pergunta de novo.
   */
  findBankPaymentSettlementDue(limit: number): Promise<NfseReconcileTargetDto[]>;

  /** Contagem de NFS-e por status. */
  countByStatus(): Promise<NfseCountByKeyDto[]>;
  /** Contagem de cobranças por situação confirmada no provedor. */
  countByBankPaymentStatus(): Promise<NfseCountByKeyDto[]>;
  /** Quantas notas estão presas (não terminais sem movimento) acima do limiar. */
  countStuck(olderThanMinutes: number): Promise<number>;
  /** Quantas notas estão emitidas sem cobrança vinculada acima do limiar. */
  countIssuedWithoutBankPayment(olderThanMinutes: number): Promise<number>;
  /**
   * Chamadas aos provedores na janela, a partir de `nfse_attempts`. É o primeiro leitor da tabela
   * que a Onda 2 criou: até aqui o rastro era gravado e só consultado por SQL manual.
   */
  findProviderCallStats(sinceMinutes: number): Promise<NfseProviderCallStatsDto[]>;
}
