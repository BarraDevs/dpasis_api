import { CNPJ } from 'src/shared/value-objects/cnpj/cnpj.vo';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';

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
  companyIds: string[];
};

export class Supplier {
  private readonly _props: SupplierProps;

  static create(props: SupplierCreateProps): Supplier {
    return new Supplier({
      ...props,
      id: new UUID().value,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static load(props: SupplierProps): Supplier {
    return new Supplier(props);
  }

  public get props(): Readonly<SupplierProps> {
    return { ...this._props };
  }

  constructor(props: SupplierProps) {
    this._props = {
      ...props,
      cnpj: new CNPJ(props.cnpj).value,
    };
  }

  public toggleStatus(): void {
    this._props.active = !this._props.active;
  }
}
