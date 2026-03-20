import { AppException } from 'src/core/filters/app.exception';

export class ServiceFreightNotFoundError extends AppException {
  constructor() {
    super('Frete de serviço não encontrado na base de dados.', 404);
    this.name = 'ServiceFreightNotFoundError';
  }
}
