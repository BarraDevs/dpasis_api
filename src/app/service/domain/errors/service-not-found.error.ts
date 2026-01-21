import { AppException } from 'src/core/filters/app.exception';

export class ServiceNotFoundError extends AppException {
  constructor() {
    super('Serviço não encontrado na base de dados', 404);
    this.name = 'ServiceNotFoundError';
  }
}
