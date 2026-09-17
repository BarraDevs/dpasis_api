import { NfseAlreadyCanceledError } from '../errors/nfse-already-canceled.error';
import { NfseAlreadyIssuedError } from '../errors/nfse-already-issued.error';
import { NfseNotIssuedError } from '../errors/nfse-not-issued.error';
import { NfseStatus } from '../enums/nfse-status.enum';

/**
 * Cobrança paga. Três valores canônicos — cada banco mapeia o próprio vocabulário para cá.
 */
const BANK_PAYMENT_PAID_LIKE_STATUSES = ['PAID', 'RECEIVED', 'MARKED_RECEIVED'] as const;
const BANK_PAYMENT_SETTLEMENT_STATUSES = [
  ...BANK_PAYMENT_PAID_LIKE_STATUSES,
  'CANCELLED',
  'EXPIRED',
] as const;

export type NfseProps = NfseCreateProps & {
  id: number;
  status: NfseStatus;
  batchProtocol: string | null;
  nfseNumber: string | null;
  verificationCode: string | null;
  issuedAt: Date | null;
  errorMessage: string | null;
  canceledAt: Date | null;
  cancelReasonCode: number | null;
  bankPaymentProvider: string | null;
  bankPaymentRequestCode: string | null;
  bankPaymentIdempotencyKey: string | null;
  bankPaymentRequestedAt: Date | null;
  bankPaymentErrorMessage: string | null;
  bankPaymentFailedAt: Date | null;
  bankPaymentStatus: string | null;
  bankPaymentConfirmedAt: Date | null;
  /**
   * Opcionais na entrada pelo mesmo motivo de `providerAlerts`: nulos numa nota nova, e só a
   * liquidação da cobrança (webhook ou varredura) os preenche.
   */
  bankPaymentSettledAt?: Date | null;
  bankPaymentNextSettlementAt?: Date | null;
  reconcileAttemptCount: number;
  nextReconcileAt: Date | null;
  /**
   * Opcionais na entrada porque são sempre nulos numa nota nova, e porque quem carrega a nota de
   * fora do banco (testes, fixtures) não deveria precisar declarar campos que só a consulta do lote
   * preenche. Internamente são sempre `string | null` / `Date | null`.
   */
  providerAlerts?: string | null;
  providerAlertedAt?: Date | null;
  /**
   * Agendamento da retentativa automática do boleto. Opcionais na entrada pelo mesmo motivo de
   * `providerAlerts`: são sempre `0`/`null` numa nota nova, e só a falha transitória do provedor os
   * preenche.
   */
  bankPaymentRetryCount?: number;
  bankPaymentNextRetryAt?: Date | null;
  nfmId: number | null;
  /** Idade da nota. Ancora o prazo de 30 dias do cancelamento, que corre desde a emissão. */
  createdAt: Date;
};

export type NfseCreateProps = {
  companyId: number;
  clientId: number;
  rpsNumber: number;
  rpsSeries: string;
  data: Record<string, unknown>;
};

export class Nfse {
  private readonly _props: NfseProps;

  static _instantiate(props: NfseProps): Nfse {
    return new Nfse(props);
  }

  private constructor(props: NfseProps) {
    this._props = props;
  }

  public get props(): Readonly<NfseProps> {
    return { ...this._props };
  }

  public isIssued(): boolean {
    return this._props.status === NfseStatus.ISSUED;
  }

  public isFailed(): boolean {
    return this._props.status === NfseStatus.FAILED;
  }

  public isRejected(): boolean {
    return this._props.status === NfseStatus.REJECTED;
  }

  public isCanceled(): boolean {
    return this._props.status === NfseStatus.CANCELED;
  }

  public isTerminal(): boolean {
    return this.isIssued() || this.isFailed() || this.isRejected() || this.isCanceled();
  }

  public canPoll(): boolean {
    return !this.isTerminal() && !!this._props.batchProtocol;
  }

  /**
   * Só uma nota que nunca chegou ao provedor pode ser enviada pelo job de emissão. `SUBMITTED`,
   * `PROCESSING` e `AWAITING_PROVIDER` já têm — ou podem ter — uma NFS-e do outro lado, e reenviar
   * o mesmo RPS sem consultar antes é o caminho para uma segunda nota. `FAILED` fica de fora deste
   * caminho de propósito: o reenvio depois de corrigir o cadastro é ação autorizada, não reentrega
   * de job.
   */
  public canSubmitToProvider(): boolean {
    return this._props.status === NfseStatus.PENDING && !this._props.batchProtocol;
  }

  public markSubmitted(batchProtocol: string): void {
    this.ensureMutable();
    this._props.status = NfseStatus.SUBMITTED;
    this._props.batchProtocol = batchProtocol;
  }

  public markProcessing(): void {
    this.ensureMutable();
    this._props.status = NfseStatus.PROCESSING;
  }

  public markIssued(nfseNumber: string, verificationCode: string, issuedAt: Date): void {
    this.ensureMutable();
    this._props.status = NfseStatus.ISSUED;
    this._props.nfseNumber = nfseNumber;
    this._props.verificationCode = verificationCode;
    this._props.issuedAt = issuedAt;
  }

  public markFailed(errorMessage: string): void {
    this.ensureMutable();
    this._props.status = NfseStatus.FAILED;
    this._props.errorMessage = errorMessage;
  }

  /**
   * O fisco recusou a nota por regra de negócio — cadastro do tomador, item de serviço, alíquota.
   * Separado de `FAILED`, que passa a significar só falha determinística de infraestrutura ou de
   * configuração: as duas exigem ações opostas do operador. `REJECTED` é terminal para os jobs
   * automáticos (nenhum reenvia sozinho) mas continua mutável, porque a reemissão autorizada
   * depois de corrigir o cadastro é a saída prevista — §2.4 de `docs/auditoria-nfm-resiliencia.md`.
   */
  public markRejected(errorMessage: string): void {
    this.ensureMutable();
    this._props.status = NfseStatus.REJECTED;
    this._props.errorMessage = errorMessage;
  }

  /**
   * Estado para quando não se sabe se o provedor emitiu a nota: timeout, erro de rede, ou o
   * provedor respondendo que já conhece este RPS. Deliberadamente não terminal — só o provedor
   * pode afirmar que a nota não existe, e essa consulta ainda não existe no fluxo. Marcar
   * `FAILED` aqui faria a operação parar de procurar por uma nota que provavelmente foi emitida.
   */
  public markAwaitingProvider(reason: string): void {
    this.ensureMutable();
    this._props.status = NfseStatus.AWAITING_PROVIDER;
    this._props.errorMessage = reason;
  }

  public ensureCanCancel(): void {
    if (this.isCanceled()) {
      throw new NfseAlreadyCanceledError();
    }
    this.ensureIssued();
  }

  public markCanceled(canceledAt: Date, cancelReasonCode: number): void {
    this.ensureCanCancel();
    this._props.status = NfseStatus.CANCELED;
    this._props.canceledAt = canceledAt;
    this._props.cancelReasonCode = cancelReasonCode;
  }

  public hasBankPayment(): boolean {
    return !!this._props.bankPaymentRequestCode;
  }

  /**
   * Diz que uma tentativa anterior já chegou ao provedor. O Inter não aceita cabeçalho de
   * idempotência — só uma chave implícita de 30 minutos —, então esta marca, gravada **antes** da
   * chamada, é o que faz a tentativa seguinte consultar por `seuNumero` em vez de repetir o POST.
   * É ela que protege o retry manual, que sempre acontece fora daqueles 30 minutos.
   */
  public hasRequestedBankPayment(): boolean {
    return !!this._props.bankPaymentRequestedAt;
  }

  public markBankPaymentRequested(idempotencyKey: string): void {
    this.ensureIssued();
    this._props.bankPaymentIdempotencyKey = idempotencyKey;
    this._props.bankPaymentRequestedAt = new Date();
    this._props.bankPaymentErrorMessage = null;
    this._props.bankPaymentFailedAt = null;
  }

  /**
   * Registra por que o boleto não saiu. Não mexe em `status`: a nota continua `ISSUED` — o que
   * falta é a cobrança, e sem esta coluna o alerta "ISSUED sem boleto" não tem como dizer o motivo.
   */
  public markBankPaymentFailed(errorMessage: string): void {
    this._props.bankPaymentErrorMessage = errorMessage;
    this._props.bankPaymentFailedAt = new Date();
  }

  /**
   * Agenda a próxima tentativa automática do boleto depois de uma falha transitória. `at` nulo
   * encerra o agendamento: a partir dali a falha exige decisão humana. Não conta a rodada — quem
   * conta é a varredura, ao reivindicar a nota; contar aqui somaria cada tentativa do BullMQ.
   */
  public scheduleBankPaymentRetry(at: Date | null): void {
    this._props.bankPaymentNextRetryAt = at;
  }

  public linkBankPayment(provider: string, requestCode: string): void {
    this.ensureIssued();
    this._props.bankPaymentProvider = provider;
    this._props.bankPaymentRequestCode = requestCode;
    this._props.bankPaymentErrorMessage = null;
    this._props.bankPaymentFailedAt = null;
    this._props.bankPaymentNextRetryAt = null;
  }

  /**
   * Desfaz o vínculo com uma cobrança que o provedor não conseguiu produzir (`FALHA_EMISSAO`), para
   * que o boleto seja emitido de novo. Só a rota de reemissão chama, depois de confirmar a falha no
   * próprio provedor: desfazer o vínculo de uma cobrança viva é o que produz o segundo boleto.
   *
   * `bankPaymentRequestedAt` também sai: a próxima emissão é uma solicitação nova, e é dela que corre
   * a janela da retentativa automática.
   */
  public resetBankPaymentForReissue(): void {
    this.ensureIssued();
    this._props.bankPaymentProvider = null;
    this._props.bankPaymentRequestCode = null;
    this._props.bankPaymentStatus = null;
    this._props.bankPaymentConfirmedAt = null;
    this._props.bankPaymentRequestedAt = null;
    this._props.bankPaymentIdempotencyKey = null;
    this._props.bankPaymentErrorMessage = null;
    this._props.bankPaymentFailedAt = null;
    this._props.bankPaymentNextRetryAt = null;
    this._props.bankPaymentRetryCount = 0;
    this._props.bankPaymentSettledAt = null;
    this._props.bankPaymentNextSettlementAt = null;
  }

  /**
   * Devolve a nota ao início do fluxo reaproveitando o **mesmo** RPS. É a transição
   * `REJECTED → DRAFT` da §2.4: criar um RPS novo é o que duplica a nota fiscal; reenviar o mesmo,
   * depois de o provedor afirmar que ela não existe, é seguro. O protocolo do lote antigo é
   * descartado porque ele não vale mais para nada — a consulta por ele responderia sobre o envio
   * anterior.
   */
  public resetForReissue(): void {
    this.ensureMutable();
    this._props.status = NfseStatus.PENDING;
    this._props.batchProtocol = null;
    this._props.errorMessage = null;
  }

  /**
   * Agenda a próxima consulta ao provedor. `at` nulo encerra o agendamento — usado quando a nota
   * chega a um estado terminal ou quando esgota a janela de 25 dias e passa a exigir decisão humana.
   */
  public scheduleNextReconcile(at: Date | null): void {
    this._props.reconcileAttemptCount += 1;
    this._props.nextReconcileAt = at;
  }

  /**
   * Situação da cobrança conforme o provedor, não conforme a nossa expectativa. `confirmedAt` só é
   * preenchido quando o provedor diz que o boleto existe e é cobrável; enquanto for nulo, a
   * varredura de confirmação continua perguntando.
   */
  public markBankPaymentStatus(status: string, confirmedAt: Date | null): void {
    this._props.bankPaymentStatus = status;
    this._props.bankPaymentConfirmedAt = confirmedAt;
  }

  public hasConfirmedBankPayment(): boolean {
    return !!this._props.bankPaymentConfirmedAt;
  }

  public hasSettledBankPayment(): boolean {
    return !!this._props.bankPaymentSettledAt;
  }

  public isPaidLikeBankPayment(): boolean {
    const status = this._props.bankPaymentStatus;
    return !!status && (BANK_PAYMENT_PAID_LIKE_STATUSES as readonly string[]).includes(status);
  }

  /**
   * Agenda a próxima consulta de liquidação. `at` nulo encerra o fallback: a cobrança já liquidou
   * ou nunca foi confirmada.
   */
  public scheduleBankPaymentSettlement(at: Date | null): void {
    this._props.bankPaymentNextSettlementAt = at;
  }

  /**
   * Grava pago / cancelado / expirado vindo do provedor. Pago-like não regride para cancelado ou
   * expirado. Devolve `false` quando nada muda (já liquidada no mesmo sentido).
   */
  public markBankPaymentSettlement(status: string, settledAt: Date): boolean {
    if (!(BANK_PAYMENT_SETTLEMENT_STATUSES as readonly string[]).includes(status)) {
      return false;
    }

    if (this.hasSettledBankPayment()) {
      if (this.isPaidLikeBankPayment()) {
        return false;
      }
      if (this._props.bankPaymentStatus === status) {
        return false;
      }
      this._props.bankPaymentStatus = status;
      return true;
    }

    this._props.bankPaymentStatus = status;
    this._props.bankPaymentSettledAt = settledAt;
    this._props.bankPaymentNextSettlementAt = null;
    if (!this._props.bankPaymentConfirmedAt) {
      this._props.bankPaymentConfirmedAt = settledAt;
    }
    return true;
  }

  /**
   * Ressalvas do fisco que vieram junto com a nota **emitida** (códigos `A*`). Sem `ensureMutable()`
   * de propósito: elas chegam na mesma resposta que marca a nota como `ISSUED`, então a nota já está
   * num estado imutável quando isto roda. Gravá-las não muda o ciclo de vida da nota — só registra o
   * que a Prefeitura disse.
   */
  public markProviderAlerts(alerts: string): void {
    this._props.providerAlerts = alerts;
    this._props.providerAlertedAt = null;
  }

  public hasPendingProviderAlerts(): boolean {
    return !!this._props.providerAlerts && !this._props.providerAlertedAt;
  }

  /** A operação já foi avisada; a próxima janela de alerta não repete esta nota. */
  public markProviderAlertsNotified(notifiedAt: Date = new Date()): void {
    this._props.providerAlertedAt = notifiedAt;
  }

  /**
   * `ISSUED` e `CANCELED` são os dois estados dos quais não se sai: a nota tem número junto ao
   * provedor, ou foi cancelada lá. Antes esta guarda só barrava `ISSUED`, então uma nota cancelada
   * podia voltar a `ISSUED` mantendo `canceledAt` preenchido — o invariante dependia de cada
   * chamador lembrar de checar `isTerminal()`, e nem todos checavam.
   *
   * `FAILED`, `REJECTED` e `AWAITING_PROVIDER` continuam mutáveis de propósito: a máquina de
   * estados alvo (§2.4 de `docs/auditoria-nfm-resiliencia.md`) prevê reemissão autorizada depois de
   * corrigir o cadastro, e `AWAITING_PROVIDER → ISSUED` quando a consulta ao provedor confirmar a
   * nota.
   */
  private ensureMutable(): void {
    if (this.isIssued()) {
      throw new NfseAlreadyIssuedError();
    }
    if (this.isCanceled()) {
      throw new NfseAlreadyCanceledError();
    }
  }

  private ensureIssued(): void {
    if (!this.isIssued()) {
      throw new NfseNotIssuedError();
    }
  }
}
