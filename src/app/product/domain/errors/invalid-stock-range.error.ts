import { AppException } from 'src/core/filters/app.exception';

export class InvalidStockRangeError extends AppException {
  constructor() {
    super('Estoque mínimo deve ser menor ou igual ao estoque máximo', 400);
    this.name = 'InvalidStockRangeError';
  }
}
