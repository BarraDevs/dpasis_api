import { AppException } from 'src/core/filters/app.exception';

export class InsufficientStockError extends AppException {
  constructor() {
    super('Estoque insuficiente para realizar a saída', 409);
    this.name = 'InsufficientStockError';
  }
}
