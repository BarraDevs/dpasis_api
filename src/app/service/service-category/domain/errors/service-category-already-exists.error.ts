import { AppException } from 'src/core/filters/app.exception';

export class ServiceCategoryAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe uma categoria de serviço com o nome: ${name}`, 409);
    this.name = 'ServiceCategoryAlreadyExistsError';
  }
}
