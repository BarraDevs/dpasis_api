import { AppException } from 'src/core/filters/app.exception';

export class InvalidMinimumStockError extends AppException {
  constructor() {
    super('Estoque mínimo deve ser maior ou igual a 0', 400);
    this.name = 'InvalidMinimumStockError';
  }
}
