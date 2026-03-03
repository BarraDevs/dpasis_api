export type CompanyProps = CompanyCreateProps & {
  id: number;
  active: boolean;
};

export type CompanyCreateProps = {
  name: string;
  fantasyName: string;
  document: string;
  ie: string | null;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  phone01: string;
  phone02: string | null;
  cellphone: string | null;
  email01: string;
  email02: string | null;
};

export class Company {
  private readonly _props: CompanyProps;

  static _instantiate(props: CompanyProps): Company {
    return new Company(props);
  }

  private constructor(props: CompanyProps) {
    this._props = props;
  }

  public get props(): Readonly<CompanyProps> {
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
