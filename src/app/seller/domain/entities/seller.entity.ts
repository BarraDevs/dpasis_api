export type SellerProps = SellerCreateProps & {
  id: number;
  active: boolean;
};

export type SellerCreateProps = {
  name: string;
  phone: string;
  nickname: string | null;
  whatsapp: string;
  email: string;
  commission: number;
  profilePictureUrl: string | null;
  observation: string | null;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
};

export class Seller {
  private readonly _props: SellerProps;

  static _instantiate(props: SellerProps): Seller {
    return new Seller(props);
  }

  private constructor(props: SellerProps) {
    this._props = props;
  }

  public get props(): Readonly<SellerProps> {
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
