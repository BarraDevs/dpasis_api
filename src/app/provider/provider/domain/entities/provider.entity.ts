export type ProviderProps = ProviderCreateProps & {
  id: number;
  active: boolean;
};

export type ProviderCreateProps = {
  name: string;
  document: string;
  ie: string | null;
  fantasyName: string;
  email: string;
  website: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
};

export class Provider {
  private readonly _props: ProviderProps;

  static _instantiate(props: ProviderProps): Provider {
    return new Provider(props);
  }

  private constructor(props: ProviderProps) {
    this._props = props;
  }

  public get props(): Readonly<ProviderProps> {
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
