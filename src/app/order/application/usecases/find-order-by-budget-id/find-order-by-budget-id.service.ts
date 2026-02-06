import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { OrderDto } from '../../dtos/order.dto';
import type { IOrderDao } from '../../persistence/dao/order-dao.interface';

@Injectable()
export class FindOrderByBudgetId {
  constructor(
    @Inject(TOKENS.OrderDao) private readonly orderDao: IOrderDao,
  ) {}

  async execute(budgetId: string): Promise<OrderDto | null> {
    return this.orderDao.findByBudgetId(budgetId);
  }
}
