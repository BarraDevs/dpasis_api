export class SellerDto {
  id: number;
  name: string;
  phone: string;
  nickname: string | null;
  whatsapp: string;
  email: string;
  commission: number;
  profilePictureUrl: string | null;
  observation: string | null;
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
