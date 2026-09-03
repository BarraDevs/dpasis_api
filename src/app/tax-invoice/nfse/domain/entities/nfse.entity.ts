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

  public isCanceled(): boolean {
    return this._props.status === NfseStatus.CANCELED;
  }

  public isTerminal(): boolean {
    return this.isIssued() || this.isFailed() || this.isCanceled();
  }

  public canPoll(): boolean {
    return !this.isTerminal() && !!this._props.batchProtocol;
  }

  public markSubmitted(batchProtocol: string): void {
    this.ensureNotIssued();
    this._props.status = NfseStatus.SUBMITTED;
    this._props.batchProtocol = batchProtocol;
  }

  public markProcessing(): void {
    this.ensureNotIssued();
    this._props.status = NfseStatus.PROCESSING;
  }

  public markIssued(nfseNumber: string, verificationCode: string, issuedAt: Date): void {
    this.ensureNotIssued();
    this._props.status = NfseStatus.ISSUED;
    this._props.nfseNumber = nfseNumber;
    this._props.verificationCode = verificationCode;
    this._props.issuedAt = issuedAt;
  }

  public markFailed(errorMessage: string): void {
    this.ensureNotIssued();
    this._props.status = NfseStatus.FAILED;
    this._props.errorMessage = errorMessage;
  }

  /**
   * Estado para quando não se sabe se o provedor emitiu a nota: timeout, erro de rede, ou o
   * provedor respondendo que já conhece este RPS. Deliberadamente não terminal — só o provedor
   * pode afirmar que a nota não existe, e essa consulta ainda não existe no fluxo. Marcar
   * `FAILED` aqui faria a operação parar de procurar por uma nota que provavelmente foi emitida.
   */
  public markAwaitingProvider(reason: string): void {
    this.ensureNotIssued();
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

  public linkBankPayment(provider: string, requestCode: string): void {
    this.ensureIssued();
    this._props.bankPaymentProvider = provider;
    this._props.bankPaymentRequestCode = requestCode;
  }

  private ensureNotIssued(): void {
    if (this.isIssued()) {
      throw new NfseAlreadyIssuedError();
    }
  }

  private ensureIssued(): void {
    if (!this.isIssued()) {
      throw new NfseNotIssuedError();
    }
  }
}
