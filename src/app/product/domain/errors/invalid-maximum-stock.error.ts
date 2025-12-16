import { AppException } from 'src/core/filters/app.exception';

export class InvalidMaximumStockError extends AppException {
  constructor() {
    super('Estoque máximo deve ser maior ou igual a 0', 400);
    this.name = 'InvalidMaximumStockError';
  }
}
