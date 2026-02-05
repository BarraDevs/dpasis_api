import { AppException } from 'src/core/filters/app.exception';

export class OrderNotFoundError extends AppException {
  constructor() {
    super('Pedido não encontrado', 404);
  }
}
