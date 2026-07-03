import { AppException } from 'src/core/filters/app.exception';

export class ProviderItemInstallmentsCountBelowPaidCountError extends AppException {
  constructor() {
    super('A quantidade de parcelas não pode ser menor que a quantidade de parcelas já pagas.', 400);
    this.name = 'ProviderItemInstallmentsCountBelowPaidCountError';
  }
}
