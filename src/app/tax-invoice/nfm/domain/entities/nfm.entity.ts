import { Nfse } from 'src/app/tax-invoice/nfse/domain/entities/nfse.entity';
import { NfmNfseMissingError } from '../errors/nfm-nfse-missing.error';

export type NfmCreateProps = {
  clientId: number;
  clientDocument: string;
  companyName: string;
  referenceMonth: number;
  referenceYear: number;
  totalValueInCents: number;
  cnaeNbsIndopId: number;
  data: Record<string, unknown>;
};

export type NfmProps = NfmCreateProps & {
  id: number;
  nfse: Nfse | null;
};

export class Nfm {
  private readonly _props: NfmProps;

  static _instantiate(props: NfmProps): Nfm {
    return new Nfm(props);
  }

  private constructor(props: NfmProps) {
    this._props = props;
  }

  public get props(): Readonly<NfmProps> {
    return { ...this._props };
  }

  public hasNfse(): boolean {
    return this._props.nfse !== null;
  }

  public ensureHasNfse(): void {
    if (!this.hasNfse()) {
      throw new NfmNfseMissingError(this._props.id);
    }
  }

  public ensureCanCancel(): void {
    this.ensureHasNfse();
    this._props.nfse!.ensureCanCancel();
  }

  public linkNfse(nfse: Nfse): void {
    this._props.nfse = nfse;
  }
}
