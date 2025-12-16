import { AppException } from 'src/core/filters/app.exception';

export class ProductNotFoundError extends AppException {
  constructor() {
    super('Produto não encontrado na base de dados', 404);
    this.name = 'ProductNotFoundError';
  }
}
