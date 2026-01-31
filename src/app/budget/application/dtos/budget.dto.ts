export class BudgetDto {
  id: string;
  companyId: string;
  clientId: string;
  sellerId: string;
  freightType: string;
  shipperId: string | null;
  freightValueInCents: number;
  subtotalInCents: number;
  discountInCents: number;
  totalInCents: number;
  commercialProcess: string | null;
  commercialNote: string | null;
  observations: string | null;
  status: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  items: BudgetItemDto[];
  createdAt: Date;
  updatedAt: Date;
}

export class BudgetItemDto {
  id: string;
  itemType: string;
  productId: string | null;
  serviceId: string | null;
  description: string;
  quantity: number;
  unitPriceInCents: number;
  discountInCents: number;
  subtotalInCents: number;
  createdAt: Date;
  updatedAt: Date;
}
