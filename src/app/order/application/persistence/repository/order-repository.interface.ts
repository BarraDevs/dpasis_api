import { Order } from 'src/app/order/domain/entities/order.entity';

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByBudgetId(budgetId: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
  edit(order: Order): Promise<void>;
}
