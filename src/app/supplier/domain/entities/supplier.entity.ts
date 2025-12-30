import { CNPJ } from 'src/shared/value-objects/cnpj/cnpj.vo';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
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
      createdAt: UTCDate.create().value,
      updatedAt: UTCDate.create().value,
    });
  }

  static load(props: SupplierProps): Supplier {
    return new Supplier(props);
  }

  public get props(): Readonly<SupplierProps> {
    return { ...this._props, companyIds: [...this._props.companyIds] };
  }

  constructor(props: SupplierProps) {
    this._props = {
      id: props.id,
      active: props.active,
      createdAt: UTCDate.from(props.createdAt).value,
      updatedAt: UTCDate.from(props.updatedAt).value,
      cnpj: new CNPJ(props.cnpj).value,
      ie: props.ie,
      group: props.group,
      type: props.type,
      companyName: props.companyName,
      fantasyName: props.fantasyName,
      representative: props.representative,
      companyIds: props.companyIds ? [...props.companyIds] : [],
    };
  }

  public toggleStatus(): void {
    this._props.active = !this._props.active;
  }
}
