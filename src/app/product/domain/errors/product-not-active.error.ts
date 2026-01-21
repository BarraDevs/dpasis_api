import { AppException } from 'src/core/filters/app.exception';

export class ProductNotActiveError extends AppException {
  constructor() {
    super('Produto está inativo', 400);
    this.name = 'ProductNotActiveError';
  }
}
