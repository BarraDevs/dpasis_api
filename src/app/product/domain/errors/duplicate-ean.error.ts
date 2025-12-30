import { AppException } from 'src/core/filters/app.exception';

export class ProductDuplicateEanError extends AppException {
  constructor() {
    super('EAN já cadastrado. Tente novamente com outro EAN.', 409);
    this.name = 'ProductDuplicateEanError';
  }
}
