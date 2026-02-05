import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { OrderDto } from '../../dtos/order.dto';
import type { IOrderDao } from '../../persistence/dao/order-dao.interface';
import { FindAllOrdersQueryDto } from './dtos/find-all-orders.dto';

@Injectable()
export class FindAllOrders {
  constructor(
    @Inject(TOKENS.OrderDao) private readonly orderDao: IOrderDao,
  ) {}

  public async execute(queries: FindAllOrdersQueryDto): Promise<IPagination<OrderDto>> {
    const [result, total] = await this.orderDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
