import { AppException } from 'src/core/filters/app.exception';

export class ProviderItemInstallmentAlreadyPaidError extends AppException {
  constructor() {
    super('Parcela já foi paga.', 409);
    this.name = 'ProviderItemInstallmentAlreadyPaidError';
  }
}
