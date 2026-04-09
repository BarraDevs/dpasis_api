export class BilledDto {
  id: number;
  description: string;
  isJunction: boolean;
  installmentDays: number[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
