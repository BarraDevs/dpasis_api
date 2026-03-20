import { AppException } from 'src/core/filters/app.exception';

export class ServiceWarrantyNotFoundError extends AppException {
  constructor() {
    super('Garantia de serviço não encontrada na base de dados.', 404);
    this.name = 'ServiceWarrantyNotFoundError';
  }
}
