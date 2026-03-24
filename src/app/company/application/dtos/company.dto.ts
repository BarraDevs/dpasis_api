export class CompanyDto {
  id: number;
  name: string;
  fantasyName: string;
  document: string;
  ie: string | null;
  active: boolean;
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
  createdAt: Date;
  updatedAt: Date;
}

export class MinimalCompanyDto {
  id: number;
  name: string;
}
