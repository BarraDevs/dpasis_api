import { OrderDto } from '../../dtos/order.dto';

// TODO: mover para o usecase find-all-orders
export type FindAllOrderFilters = {
  status?: string;
  clientId?: string;
  sellerId?: string;
  companyId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
};

export interface IOrderDao {
  findAll(filters: FindAllOrderFilters): Promise<[OrderDto[], number]>;
  findById(id: string): Promise<OrderDto | null>;
}
