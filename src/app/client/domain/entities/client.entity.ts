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
}

export class Client {
  private readonly _id: string; // TODO: usar Value Object UUID
  // private readonly _cnpj: CNPJ;
  private readonly _props: ClientProps;

  static create(props: ClientCreateProps): Client {
    return new Client({
      ...props,
      id: crypto.randomUUID(),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static load(props: ClientProps): Client {
    return new Client(props);
  }

  public get props(): Readonly<ClientProps> {
    return { ...this._props, id: this._id };
  }

  constructor(props: ClientProps) {
    this._id = props.id!;
    this._props = props;
  }
}
