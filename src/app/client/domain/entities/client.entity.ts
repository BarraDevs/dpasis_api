import { CNPJ } from 'src/shared/value-objects/cnpj/cnpj.vo';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
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
      createdAt: UTCDate.create().value,
      updatedAt: UTCDate.create().value,
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
      id: props.id,
      active: props.active,
      createdAt: UTCDate.from(props.createdAt).value,
      updatedAt: UTCDate.from(props.updatedAt).value,
      kind: props.kind,
      cnpj: new CNPJ(props.cnpj).value,
      ie: props.ie,
      group: props.group,
      type: props.type,
      generateInvoice: props.generateInvoice,
      companyName: props.companyName,
      fantasyName: props.fantasyName,
      owner: props.owner,
      headquarters: props.headquarters,
      companyIds: props.companyIds ? [...props.companyIds] : [],
    };
  }

  public toggleStatus(): void {
    this._props.active = !this._props.active;
    this._props.updatedAt = UTCDate.create().value;
  }
}
