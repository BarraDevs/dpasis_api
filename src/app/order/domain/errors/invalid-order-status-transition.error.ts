import { AppException } from 'src/core/filters/app.exception';
import { OrderStatus } from '../../enums/order-status.enum';

export class InvalidOrderStatusTransitionError extends AppException {
  constructor(currentStatus: OrderStatus, targetStatus: OrderStatus) {
    super(`Não é possível mudar o status de "${currentStatus}" para "${targetStatus}"`, 400);
  }
}
