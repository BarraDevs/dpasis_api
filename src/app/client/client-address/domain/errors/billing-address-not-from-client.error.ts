import { AppException } from 'src/core/filters/app.exception';

export class BillingAddressNotFromClientError extends AppException {
  constructor() {
    super('Endereço de cobrança não pertence ao cliente.', 400);
    this.name = 'BillingAddressNotFromClientError';
  }
}
