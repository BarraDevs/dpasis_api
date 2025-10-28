export class ContactDto {
  id: string;
  name: string;
  department: string;
  email: string;
  phone: string;
  whatsapp: string;
  info: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}
