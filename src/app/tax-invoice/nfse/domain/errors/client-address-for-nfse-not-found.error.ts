import { AppException } from 'src/core/filters/app.exception';

export class ClientAddressForNfseNotFoundError extends AppException {
  constructor() {
    super('Cliente não possui endereço de cobrança ou principal com código IBGE do município cadastrado.', 400);
    this.name = 'ClientAddressForNfseNotFoundError';
  }
}
