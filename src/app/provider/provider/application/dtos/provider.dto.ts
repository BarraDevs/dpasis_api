export class ProviderDto {
  id: number;
  name: string;
  document: string;
  ie: string | null;
  fantasyName: string;
  email: string;
  website: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
