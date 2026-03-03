export class ClientContactDto {
  id: number;
  clientId: number;
  department: {
    id: number;
    name: string;
  };
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  observations: string | null;
  receiveNF: boolean;
  createdAt: Date;
  updatedAt: Date;
}
