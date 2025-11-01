import { AppException } from 'src/core/filters/app.exception';

export class ItemNotFoundError extends AppException {
  constructor() {
    super('Item não encontrado na base de dados', 404);
    this.name = 'ItemNotFoundError';
  }
}
