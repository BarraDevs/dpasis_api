export class CreateOrderFromBudgetInputDto {
  budgetId: string;
  accountId: string;
}

export class CreateOrderFromBudgetOutputDto {
  orderId: string;
  budgetId: string;
  createdAt: Date;
}
