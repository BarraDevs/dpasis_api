import { AppException } from 'src/core/filters/app.exception';

export class ServiceDuplicateCategoryError extends AppException {
  constructor() {
    super('Já existe uma categoria de serviço com este nome na base de dados', 409);
    this.name = 'ServiceDuplicateCategoryError';
  }
}
