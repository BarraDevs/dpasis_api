import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';

type ClientProps = ClientCreateProps & {
  id: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type ClientCreateProps = {
  kind: string;
  cnpj: string;
  ie: string;
  group: string;
  type: string;
  generateInvoice: boolean;
  companyName: string;
  fantasyName: string;
  owner: string;
  headquarters: string;
  companyIds: string[];
}

export class Client {
  private readonly _props: ClientProps;

  static create(props: ClientCreateProps): Client {
    return new Client({
      ...props,
      id: new UUID().value,
      // cnpj: new CNPJ(props.cnpj).value,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static load(props: ClientProps): Client {
    return new Client(props);
  }

  public get props(): Readonly<ClientProps> {
    return { ...this._props };
  }

  constructor(props: ClientProps) {
    this._props = props;
  }

  public toggleStatus(): void {
    this._props.active = !this._props.active;
    this._props.updatedAt = new Date();
  }
}
