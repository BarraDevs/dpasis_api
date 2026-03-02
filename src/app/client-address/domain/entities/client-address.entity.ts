import { ClientAddressType } from '../enums/client-address-type.enum';

export type ClientAddressProps = ClientAddressCreateProps & {
  id: number | null;
};

export type ClientAddressCreateProps = {
  clientId: number;
  type: ClientAddressType;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
};

export class ClientAddress {
  private readonly _props: ClientAddressProps;

  static _instantiate(props: ClientAddressProps): ClientAddress {
    return new ClientAddress(props);
  }

  private constructor(props: ClientAddressProps) {
    this._props = props;
  }

  public get props(): Readonly<ClientAddressProps> {
    return { ...this._props };
  }

  public isMain(): boolean {
    return this._props.type === ClientAddressType.MAIN;
  }
}
