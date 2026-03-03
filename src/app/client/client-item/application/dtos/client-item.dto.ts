export class ClientItemDto {
  id: number;
  clientId: number;
  description: string;
  quantity: number;
  unitValueInCents: number;
  totalValueInCents: number;
  cnae: string;
  nbs: string;
  indop: string;
  createdAt: Date;
  updatedAt: Date;
}
