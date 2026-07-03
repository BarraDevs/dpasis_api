import { AppException } from 'src/core/filters/app.exception';

export class ProviderItemInstallmentNotFoundError extends AppException {
  constructor() {
    super('Parcela do item do prestador não encontrada.', 404);
    this.name = 'ProviderItemInstallmentNotFoundError';
  }
}
