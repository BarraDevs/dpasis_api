import { ClientInvoiceType } from '../enums/client-invoice-type.enum';
import { ClientType } from '../enums/client-type.enum';

export type ClientProps = ClientCreateProps & {
  id: number;
  active: boolean;
};

export type ClientCreateProps = {
  type: ClientType;
  document: string;
  ie: string | null;
  groupId: number;
  ownerId: number;
  invoiceType: ClientInvoiceType;
  generateInvoice: boolean;
  companyName: string;
  fantasyName: string | null;
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
}
