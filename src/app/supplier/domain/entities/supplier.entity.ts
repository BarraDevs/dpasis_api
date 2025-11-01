type SupplierProps = SupplierCreateProps & {
  id: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type SupplierCreateProps = {
  cnpj: string;
  ie: string;
  group: string;
  type: string;
  companyName: string;
  fantasyName: string;
  representative: string;
};

export class Supplier {
  private readonly _id: string; // TODO: usar Value Object UUID
  // private readonly _cnpj: CNPJ;
  private readonly _props: SupplierProps;

  static create(props: SupplierCreateProps): Supplier {
    return new Supplier({
      ...props,
      id: crypto.randomUUID(),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static load(props: SupplierProps): Supplier {
    return new Supplier(props);
  }

  public get props(): Readonly<SupplierProps> {
    return { ...this._props, id: this._id };
  }

  constructor(props: SupplierProps) {
    this._id = props.id!;
    this._props = props;
  }
}
