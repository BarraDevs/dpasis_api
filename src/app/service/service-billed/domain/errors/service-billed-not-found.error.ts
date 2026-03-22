import { AppException } from 'src/core/filters/app.exception';

export class ServiceBilledNotFoundError extends AppException {
  constructor() {
    super('Serviço faturado não encontrado na base de dados.', 404);
    this.name = 'ServiceBilledNotFoundError';
  }
}
