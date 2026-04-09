import { AppException } from 'src/core/filters/app.exception';

export class WarrantyNotFoundError extends AppException {
  constructor() {
    super('Garantia não encontrada na base de dados.', 404);
    this.name = 'WarrantyNotFoundError';
  }
}
