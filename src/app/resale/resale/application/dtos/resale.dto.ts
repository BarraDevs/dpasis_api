export class ResaleDto {
  id: number;
  name: string;
  identifier: string | null;
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  licenseType: string;
  document: string;
  ie: string | null;
  phone01: string;
  phone02: string | null;
  voucher: string | null;
  email: string | null;
  website: string | null;
  receivesSupportEmail: boolean;
  servedByDpa: boolean;
  manufacturerReseller: boolean;
  profilePictureUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
