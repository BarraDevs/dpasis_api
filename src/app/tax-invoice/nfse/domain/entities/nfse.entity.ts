import { NfseAlreadyCanceledError } from '../errors/nfse-already-canceled.error';
import { NfseAlreadyIssuedError } from '../errors/nfse-already-issued.error';
import { NfseNotIssuedError } from '../errors/nfse-not-issued.error';
import { NfseStatus } from '../enums/nfse-status.enum';

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
  reconcileAttemptCount: number;
  nextReconcileAt: Date | null;
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

  public linkBankPayment(provider: string, requestCode: string): void {
    this.ensureIssued();
    this._props.bankPaymentProvider = provider;
    this._props.bankPaymentRequestCode = requestCode;
    this._props.bankPaymentErrorMessage = null;
    this._props.bankPaymentFailedAt = null;
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
