import { NfseAlertRowDto, NfseDailyClosingDto } from '../../dtos/nfse-alert-row.dto';
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
  /** Cobranças cuja produção o provedor recusou (P1-08) e que ninguém reemitiu ainda. */
  findBankPaymentFailed(): Promise<NfseAlertRowDto[]>;
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
   * Cobranças solicitadas ao provedor e ainda não confirmadas. `POST /cobrancas` é assíncrono:
   * `codigoSolicitacao` diz que a solicitação foi aceita, não que o boleto existe.
   */
  findBankPaymentUnconfirmed(olderThanMinutes: number, limit: number): Promise<NfseReconcileTargetDto[]>;
}
