export class ItemDto {
  id: string;
  ownerId: string;
  description: string;
  serviceCode: string;
  quantity: number;
  unitPriceInCents: number;
  createdAt: Date;
  updatedAt: Date;
}
