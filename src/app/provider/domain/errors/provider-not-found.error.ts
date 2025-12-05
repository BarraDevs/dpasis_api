import { AppException } from 'src/core/filters/app.exception';

export class ProviderNotFoundError extends AppException {
  constructor() {
    super('Prestador não encontrado na base de dados', 404);
    this.name = 'ProviderNotFoundError';
  }
}
