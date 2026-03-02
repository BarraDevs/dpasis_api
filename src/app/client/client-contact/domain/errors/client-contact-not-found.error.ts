import { AppException } from 'src/core/filters/app.exception';

export class ClientContactNotFoundError extends AppException {
  constructor() {
    super('Contato de cliente não encontrado na base de dados.', 404);
    this.name = 'ClientContactNotFoundError';
  }
}
