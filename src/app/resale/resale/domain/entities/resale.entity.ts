export type ResaleCreateProps = {
  name: string;
  identifier: string | null;
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  licenseType: string;
  document: string;
  ie: string | null;
  phone01: string;
  phone02: string | null;
  voucher: string | null;
  email: string | null;
  website: string | null;
  receivesSupportEmail: boolean;
  servedByDpa: boolean;
  manufacturerReseller: boolean;
};

export type ResaleProps = ResaleCreateProps & {
  id: number;
  active: boolean;
};

export class Resale {
  private readonly _props: ResaleProps;

  static _instantiate(props: ResaleProps): Resale {
    return new Resale(props);
  }

  private constructor(props: ResaleProps) {
    this._props = props;
  }

  public get props(): Readonly<ResaleProps> {
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
