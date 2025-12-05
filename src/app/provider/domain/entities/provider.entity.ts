import { CNPJ } from 'src/shared/value-objects/cnpj/cnpj.vo';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';
import { ProviderType } from '../enums/provider-type.enum';
import { InvalidProviderTypeError } from '../errors/invalid-provider-type.error';

type ProviderProps = ProviderCreateProps & {
  id: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type ProviderCreateProps = {
  name: string;
  type: string;
  valueInCents: number;
  cnpj: string;
  ie: string;
  paymentDay: number | null;
  paymentExpirationDate: Date | null;
  companyName: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  reference: string | null;
  neighborhood: string;
  city: string;
  state: string;
  email: string;
  website: string | null;
  companyIds: string[];
}

export class Provider {
  private readonly _props: ProviderProps;

  static create(props: ProviderCreateProps): Provider {
    return new Provider({
      ...props,
      id: new UUID().value,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static load(props: ProviderProps): Provider {
    return new Provider(props);
  }

  public get props(): Readonly<ProviderProps> {
    return { ...this._props, companyIds: [...this._props.companyIds] };
  }

  constructor(props: ProviderProps) {
    const isTypeValid = Object.values(ProviderType).includes(props.type as ProviderType);
    if (!isTypeValid) {
      throw new InvalidProviderTypeError();
    }

    this._props = {
      ...props,
      cnpj: new CNPJ(props.cnpj).value,
      paymentDay: props.type === ProviderType.RECURRING ? props.paymentDay : null,
      paymentExpirationDate: props.type === ProviderType.ONE_TIME ? props.paymentExpirationDate : null,
    };
  }

  public toggleStatus(): void {
    this._props.active = !this._props.active;
  }
}


