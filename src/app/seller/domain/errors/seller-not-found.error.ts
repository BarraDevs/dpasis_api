import { AppException } from 'src/core/filters/app.exception';

export class SellerNotFoundError extends AppException {
  constructor() {
    super('Vendedor não encontrado na base de dados', 404);
    this.name = 'SellerNotFoundError';
  }
}

