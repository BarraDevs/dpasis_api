import { ClientInvoiceType } from '../enums/client-invoice-type.enum';
import { ClientType } from '../enums/client-type.enum';

export type ClientProps = Omit<ClientCreateProps, 'parentClientId' | 'domain'> & {
  id: number;
  active: boolean;
  parentClientId: number | null;
  isSubClient: boolean;
  domain: string | null;
};

export type ClientCreateProps = {
  type: ClientType;
  document: string;
  ie: string | null;
  groupId: number;
  resaleId: number;
  parentClientId?: number | null;
  companyIds: number[];
  invoiceType: ClientInvoiceType;
  generateInvoice: boolean;
  companyName: string;
  fantasyName: string | null;
  domain?: string | null;
  headquarters: string;
};

export class Client {
  private readonly _props: ClientProps;

  static _instantiate(props: ClientProps): Client {
    return new Client(props);
  }

  private constructor(props: ClientProps) {
    this._props = props;
  }

  public get props(): Readonly<ClientProps> {
    return { ...this._props };
  }

  public isActive(): boolean {
    return this._props.active;
  }

  public activate(): void {
    this._props.active = true;
  }

  public deactivate(): void {
    this._props.active = false;
  }
}
