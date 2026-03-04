export type ClientItemProps = ClientItemCreateProps & {
  id: number | null;
};

export type ClientItemCreateProps = {
  clientId: number;
  description: string;
  quantity: number;
  unitValueInCents: number;
  cnaeNbsIndopId: number;
};

export class ClientItem {
  private readonly _props: ClientItemProps;

  static _instantiate(props: ClientItemProps): ClientItem {
    return new ClientItem(props);
  }

  private constructor(props: ClientItemProps) {
    this._props = props;
  }

  public get props(): Readonly<ClientItemProps> {
    return { ...this._props };
  }
}
