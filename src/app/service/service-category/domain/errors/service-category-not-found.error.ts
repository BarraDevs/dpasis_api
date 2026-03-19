import { AppException } from 'src/core/filters/app.exception';

export class ServiceCategoryNotFoundError extends AppException {
  constructor() {
    super('Categoria de serviço não encontrada na base de dados.', 404);
    this.name = 'ServiceCategoryNotFoundError';
  }
}
