import { AppException } from 'src/core/filters/app.exception';

export class ServiceFreightAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um frete de serviço com o nome: ${name}`, 409);
    this.name = 'ServiceFreightAlreadyExistsError';
  }
}
