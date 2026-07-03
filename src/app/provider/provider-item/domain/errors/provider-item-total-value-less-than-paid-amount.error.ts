import { AppException } from 'src/core/filters/app.exception';

export class ProviderItemTotalValueLessThanPaidAmountError extends AppException {
  constructor() {
    super('O valor total não pode ser menor que a soma das parcelas já pagas.', 400);
    this.name = 'ProviderItemTotalValueLessThanPaidAmountError';
  }
}
