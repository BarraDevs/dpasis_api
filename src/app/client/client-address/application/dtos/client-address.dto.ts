export class ClientAddressDto {
  id: number;
  clientId: number;
  type: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  cityCodeIbge: string | null;
  state: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
