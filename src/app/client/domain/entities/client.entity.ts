type ClientProps = ClientCreateProps & {
  id: string;
  active: boolean;
  mainAddressId: string | null;
  createdAt: string;
  updatedAt: string;
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
  private readonly _props: ClientProps;

  static create(props: ClientCreateProps): Client {
    return new Client({
      ...props,
      id: crypto.randomUUID(),
      active: true,
      mainAddressId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
