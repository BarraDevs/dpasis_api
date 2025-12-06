import { Document } from 'src/shared/value-objects/document/document.vo';
import { Email } from 'src/shared/value-objects/email/email.vo';
import { Phone } from 'src/shared/value-objects/phone/phone.vo';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';

type CompanyProps = CompanyCreateProps & {
  id: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type CompanyCreateProps = {
  name: string;
  fantasyName: string;
  document: string;
  ie: string;

  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  reference: string | null;
  neighborhood: string;
  city: string;
  state: string;

  phone01: string;
  phone02: string | null;
  cellphone: string | null;
  email01: string;
  email02: string | null;
}

export class Company {
  private readonly _props: CompanyProps;

  static create(props: CompanyCreateProps): Company {
    return new Company({
      ...props,
      id: new UUID().value,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static load(props: CompanyProps): Company {
    return new Company(props);
  }

  constructor(props: CompanyProps) {
    this._props = {
      id: props.id,
      active: props.active,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      name: props.name,
      fantasyName: props.fantasyName,
      document: new Document(props.document).value,
      ie: props.ie,
      zipCode: props.zipCode,
      street: props.street,
      number: props.number,
      complement: props.complement,
      reference: props.reference,
      neighborhood: props.neighborhood,
      city: props.city,
      state: props.state,
      phone01: new Phone(props.phone01).value,
      phone02: props.phone02 ? new Phone(props.phone02).value : null,
      cellphone: props.cellphone ? new Phone(props.cellphone).value : null,
      email01: new Email(props.email01).value,
      email02: props.email02 ? new Email(props.email02).value : null,
    };
  }

  public get props(): Readonly<CompanyProps> {
    return { ...this._props };
  }

  public toggleStatus(): void {
    this._props.active = !this._props.active;
  }
}
