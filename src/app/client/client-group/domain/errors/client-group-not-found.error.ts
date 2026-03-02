import { AppException } from 'src/core/filters/app.exception';

export class ClientGroupNotFoundError extends AppException {
  constructor() {
    super('Grupo de clientes não encontrado na base de dados.', 404);
    this.name = 'ClientGroupNotFoundError';
  }
}
