import { CNPJ } from 'src/shared/value-objects/cnpj/cnpj.vo';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';

type ShipperProps = ShipperCreateProps & {
  id: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type ShipperCreateProps = {
  companyName: string;
  fantasyName: string;
  cnpj: string;
  contact: string;
  representative: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  reference: string | null;
  neighborhood: string;
  city: string;
  state: string;
  companyIds: string[];
}

export class Shipper {
  private readonly _props: ShipperProps;

  static create(props: ShipperCreateProps): Shipper {
    return new Shipper({
      ...props,
      id: new UUID().value,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static load(props: ShipperProps): Shipper {
    return new Shipper(props);
  }

  public get props(): Readonly<ShipperProps> {
    return { ...this._props, companyIds: [...this._props.companyIds] };
  }

  constructor(props: ShipperProps) {
    this._props = {
      ...props,
      cnpj: new CNPJ(props.cnpj).value,
    };
  }

  public toggleStatus(): void {
    this._props.active = !this._props.active;
  }
}
