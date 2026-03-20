import { AppException } from 'src/core/filters/app.exception';

export class ServiceDeliveryTermNotFoundError extends AppException {
  constructor() {
    super('Prazo de entrega não encontrado na base de dados.', 404);
    this.name = 'ServiceDeliveryTermNotFoundError';
  }
}
