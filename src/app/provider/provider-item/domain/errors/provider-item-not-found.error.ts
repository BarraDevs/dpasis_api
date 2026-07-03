import { AppException } from 'src/core/filters/app.exception';

export class ProviderItemNotFoundError extends AppException {
  constructor() {
    super('Item do prestador não encontrado.', 404);
    this.name = 'ProviderItemNotFoundError';
  }
}
