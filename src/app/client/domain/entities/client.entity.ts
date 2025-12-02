import { CNPJ } from 'src/shared/value-objects/cnpj/cnpj.vo';
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
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static load(props: ClientProps): Client {
    return new Client(props);
  }

  public get props(): Readonly<ClientProps> {
    return { ...this._props, companyIds: [...this._props.companyIds] };
  }

  constructor(props: ClientProps) {
    this._props = {
      ...props,
      cnpj: new CNPJ(props.cnpj).value,
    };
  }

  public toggleStatus(): void {
    this._props.active = !this._props.active;
  }
}
