import { AppException } from 'src/core/filters/app.exception';

export class ClientItemNotFoundError extends AppException {
  constructor() {
    super('Item do cliente não encontrado na base de dados.', 404);
    this.name = 'ClientItemNotFoundError';
  }
}
