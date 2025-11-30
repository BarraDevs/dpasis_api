export class CompanyDto {
  id: string;
  name: string;
  fantasyName: string;
  document: string;
  ie: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;

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
