import { Inject, Injectable } from '@nestjs/common';
import { OrderNotFoundError } from 'src/app/order/domain/errors/order-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { OrderDto } from '../../dtos/order.dto';
import type { IOrderDao } from '../../persistence/dao/order-dao.interface';

@Injectable()
export class FindOrderById {
  constructor(
    @Inject(TOKENS.OrderDao) private readonly orderDao: IOrderDao,
  ) {}

  async execute(id: string): Promise<OrderDto> {
    const order = await this.orderDao.findById(id);
    if (!order) {
      throw new OrderNotFoundError();
    }

    return order;
  }
}
