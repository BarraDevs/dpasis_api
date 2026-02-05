import { OrderDto } from '../../dtos/order.dto';
import { FindAllOrdersQueryDto } from '../../usecases/find-all-orders/dtos/find-all-orders.dto';

export interface IOrderDao {
  findAll(queries: FindAllOrdersQueryDto): Promise<[OrderDto[], number]>;
  findById(id: string): Promise<OrderDto | null>;
}
