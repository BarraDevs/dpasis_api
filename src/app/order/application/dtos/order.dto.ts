export class OrderStatusHistoryDto {
  status: string;
  changedAt: string;
  changedBy: string;
  observation: string | null;
}

export class OrderDto {
  id: string;
  budgetId: string;
  status: string;
  trackingCode: string | null;
  createdBy: string;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  statusHistory: OrderStatusHistoryDto[];
  createdAt: Date;
  updatedAt: Date;
}
