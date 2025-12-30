import { CNPJ } from 'src/shared/value-objects/cnpj/cnpj.vo';
import { Email } from 'src/shared/value-objects/email/email.vo';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
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
      createdAt: UTCDate.create().value,
      updatedAt: UTCDate.create().value,
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
      id: props.id,
      active: props.active,
      createdAt: UTCDate.from(props.createdAt).value,
      updatedAt: UTCDate.from(props.updatedAt).value,
      name: props.name,
      type: props.type,
      valueInCents: props.valueInCents,
      cnpj: new CNPJ(props.cnpj).value,
      ie: props.ie,
      paymentDay: props.type === ProviderType.RECURRING ? props.paymentDay : null,
      paymentExpirationDate: props.type === ProviderType.ONE_TIME ? props.paymentExpirationDate : null,
      companyName: props.companyName,
      zipCode: props.zipCode,
      street: props.street,
      number: props.number,
      complement: props.complement,
      reference: props.reference,
      neighborhood: props.neighborhood,
      city: props.city,
      state: props.state,
      email: new Email(props.email).value,
      website: props.website,
      companyIds: props.companyIds ? [...props.companyIds] : [],
    };
  }

  public toggleStatus(): void {
    this._props.active = !this._props.active;
  }
}
