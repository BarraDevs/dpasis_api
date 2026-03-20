import { AppException } from 'src/core/filters/app.exception';

export class ServiceWarrantyAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe uma garantia de serviço com o nome: ${name}`, 409);
    this.name = 'ServiceWarrantyAlreadyExistsError';
  }
}
