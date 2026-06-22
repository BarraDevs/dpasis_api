export class CarrierDto {
  id: number;
  name: string;
  fantasyName: string;
  representative: string;
  document: string;
  contact: string;
  active: boolean;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  createdAt: Date;
  updatedAt: Date;
}
