import { DiscountType } from '../../domain/enums/discount-type.enum';

export class ClientDiscountDto {
  id: number;
  clientId: number;
  description: string;
  type: DiscountType;
  discountValue: number;
  month: number;
  year: number;
  doNotGenerateCharge: boolean;
  terminateContract: boolean;
  createdAt: Date;
  updatedAt: Date;
}
