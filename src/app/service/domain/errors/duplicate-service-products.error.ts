import { AppException } from 'src/core/filters/app.exception';

export class DuplicateServiceProductsError extends AppException {
  constructor() {
    super('Produtos duplicados não são permitidos', 400);
    this.name = 'DuplicateServiceProductsError';
  }
}
