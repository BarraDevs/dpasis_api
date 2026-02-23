import { AppException } from 'src/core/filters/app.exception';

export class ClientOwnerNotFoundError extends AppException {
  constructor() {
    super('Proprietário de clientes não encontrado na base de dados.', 404);
    this.name = 'ClientOwnerNotFoundError';
  }
}
