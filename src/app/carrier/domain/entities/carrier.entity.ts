export type CarrierProps = CarrierCreateProps & {
  id: number;
  active: boolean;
};

export type CarrierCreateProps = {
  name: string;
  fantasyName: string;
  representative: string;
  document: string;
  contact: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
};

export class Carrier {
  private readonly _props: CarrierProps;

  static _instantiate(props: CarrierProps): Carrier {
    return new Carrier(props);
  }

  private constructor(props: CarrierProps) {
    this._props = props;
  }

  public get props(): Readonly<CarrierProps> {
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
