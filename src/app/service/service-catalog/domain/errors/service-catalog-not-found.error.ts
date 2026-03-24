import { AppException } from 'src/core/filters/app.exception';

export class ServiceCatalogNotFoundError extends AppException {
  constructor() {
    super('Serviço não encontrado na base de dados.', 404);
    this.name = 'ServiceCatalogNotFoundError';
  }
}
