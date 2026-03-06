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
  state: string;
  createdAt: Date;
  updatedAt: Date;
}
