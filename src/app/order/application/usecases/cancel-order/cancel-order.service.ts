import { Inject, Injectable } from '@nestjs/common';
import { OrderNotFoundError } from 'src/app/order/domain/errors/order-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IOrderRepository } from '../../persistence/repository/order-repository.interface';
import { CancelOrderInputDto } from './dtos/cancel-order.dto';

@Injectable()
export class CancelOrder {
  constructor(
    @Inject(TOKENS.OrderRepository) private readonly orderRepository: IOrderRepository,
  ) {}

  public async execute(id: string, accountId: string, data: CancelOrderInputDto): Promise<SuccessMessage> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new OrderNotFoundError();
    }

    order.cancel(accountId, data.reason);
    await this.orderRepository.edit(order);

    return { message: 'Pedido cancelado com sucesso!' };
  }
}
