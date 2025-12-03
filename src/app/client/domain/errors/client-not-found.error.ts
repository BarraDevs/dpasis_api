import { AppException } from 'src/core/filters/app.exception';

export class ClientNotFoundError extends AppException {
  constructor() {
    super('Cliente não encontrado na base de dados', 404);
    this.name = 'ClientNotFoundError';
  }
}
