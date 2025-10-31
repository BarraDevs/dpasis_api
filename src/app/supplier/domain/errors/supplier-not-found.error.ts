import { AppException } from 'src/core/filters/app.exception';

export class SupplierNotFoundError extends AppException {
  constructor() {
    super('Fornecedor não encontrado na base de dados', 404);
    this.name = 'SupplierNotFoundError';
  }
}
