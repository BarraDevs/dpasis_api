import { ProviderType } from '../../domain/enums/provider-type.enum';

export class ProviderDto {
  id: number;
  name: string;
  type: ProviderType;
  valueInCents: number;
  document: string;
  ie: string | null;
  paymentDate: number | null;
  deadline: number | null;
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
