export class ResaleContactDto {
  id: number;
  resaleId: number;
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
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
