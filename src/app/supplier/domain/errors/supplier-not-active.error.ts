import { AppException } from 'src/core/filters/app.exception';

export class SupplierNotActiveError extends AppException {
  constructor(name?: string) {
    super(`Fornecedor ${name ?? ''} não está ativo`, 400);
    this.name = 'SupplierNotActiveError';
  }
}
