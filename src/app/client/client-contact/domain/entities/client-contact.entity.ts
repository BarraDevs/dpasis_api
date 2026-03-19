export type ClientContactProps = ClientContactCreateProps & {
  id: number | null;
  active: boolean;
};

export type ClientContactCreateProps = {
  clientId: number;
  departmentId: number;
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  observations: string | null;
  receiveNF: boolean;
};

export class ClientContact {
  private readonly _props: ClientContactProps;

  static _instantiate(props: ClientContactProps): ClientContact {
    return new ClientContact(props);
  }

  private constructor(props: ClientContactProps) {
    this._props = props;
  }

  public get props(): Readonly<ClientContactProps> {
    return { ...this._props };
  }

  public isActive(): boolean {
    return this._props.active ?? true;
  }

  public activate(): void {
    this._props.active = true;
  }

  public deactivate(): void {
    this._props.active = false;
  }
}
