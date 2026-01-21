import { Commission } from 'src/shared/value-objects/commission/commision.vo';
import { Email } from 'src/shared/value-objects/email/email.vo';
import { Phone } from 'src/shared/value-objects/phone/phone.vo';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';

type SellerProps = SellerCreateProps & {
  id: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type SellerCreateProps = {
  name: string;
  nickname: string | null;
  phone: string;
  cellphone: string;
  email: string;
  commission: number;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  reference: string | null;
  neighborhood: string;
  city: string;
  state: string;
  observation: string | null;
  avatarUrl: string | null;
  companyIds: string[];
}

export class Seller {
  private readonly _props: SellerProps;

  static create(props: SellerCreateProps): Seller {
    return new Seller({
      ...props,
      id: new UUID().value,
      active: true,
      createdAt: UTCDate.create().value,
      updatedAt: UTCDate.create().value,
    });
  }

  static load(props: SellerProps): Seller {
    return new Seller(props);
  }

  public get props(): Readonly<SellerProps> {
    return { ...this._props, companyIds: [...this._props.companyIds] };
  }

  constructor(props: SellerProps) {
    this._props = {
      id: props.id,
      active: props.active,
      createdAt: UTCDate.from(props.createdAt).value,
      updatedAt: UTCDate.from(props.updatedAt).value,
      name: props.name,
      nickname: props.nickname,
      phone: new Phone(props.phone).value,
      cellphone: new Phone(props.cellphone).value,
      email: new Email(props.email).value,
      commission: new Commission(props.commission).value,
      zipCode: props.zipCode,
      street: props.street,
      number: props.number,
      complement: props.complement,
      reference: props.reference,
      neighborhood: props.neighborhood,
      city: props.city,
      state: props.state,
      observation: props.observation,
      avatarUrl: props.avatarUrl,
      companyIds: props.companyIds ? [...props.companyIds] : [],
    };
  }

  public toggleStatus(): void {
    this._props.active = !this._props.active;
    this._props.updatedAt = UTCDate.create().value;
  }
}

