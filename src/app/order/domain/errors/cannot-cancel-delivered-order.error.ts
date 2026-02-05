import { AppException } from 'src/core/filters/app.exception';

export class CannotCancelDeliveredOrderError extends AppException {
  constructor() {
    super('Não é possível cancelar um pedido já entregue', 400);
  }
}
