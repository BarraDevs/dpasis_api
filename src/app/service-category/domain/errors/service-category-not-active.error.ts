import { AppException } from 'src/core/filters/app.exception';

export class ServiceCategoryNotActiveError extends AppException {
  constructor() {
    super('Categoria de serviço está inativa', 400);
    this.name = 'ServiceCategoryNotActiveError';
  }
}
