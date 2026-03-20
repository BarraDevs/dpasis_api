import { AppException } from 'src/core/filters/app.exception';

export class ServiceDeliveryTermAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um prazo de entrega com o nome: ${name}`, 409);
    this.name = 'ServiceDeliveryTermAlreadyExistsError';
  }
}
