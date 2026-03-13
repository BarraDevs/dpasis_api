import { AppException } from 'src/core/filters/app.exception';

export class ClientTypeNotFoundError extends AppException {
  constructor() {
    super('Tipo de cliente não encontrado na base de dados.', 404);
    this.name = 'ClientTypeNotFoundError';
  }
}
