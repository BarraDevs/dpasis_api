export class ClientContactDto {
  id: number;
  clientId: number;
  departmentId: number;
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  observations: string | null;
  receiveNF: boolean;
  createdAt: Date;
  updatedAt: Date;
}
