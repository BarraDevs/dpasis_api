import { AppException } from 'src/core/filters/app.exception';

export class ClientSystemTypeNotFoundError extends AppException {
  constructor() {
    super('Tipo de sistema de cliente não encontrado na base de dados.', 404);
    this.name = 'ClientSystemTypeNotFoundError';
  }
}
