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

  public markCanceled(canceledAt: Date, cancelReasonCode: number): void {
    this.ensureIssued();
    this._props.status = NfseStatus.CANCELED;
    this._props.canceledAt = canceledAt;
    this._props.cancelReasonCode = cancelReasonCode;
  }

  private ensureNotIssued(): void {
    if (this._props.status === NfseStatus.ISSUED) {
      throw new NfseAlreadyIssuedError();
    }
  }

  private ensureIssued(): void {
    if (this._props.status !== NfseStatus.ISSUED) {
      throw new NfseNotIssuedError();
    }
  }
}
