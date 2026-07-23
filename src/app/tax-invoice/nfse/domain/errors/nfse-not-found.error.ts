import { AppException } from 'src/core/filters/app.exception';

export class NfseNotFoundError extends AppException {
  constructor() {
    super('Nfse não encontrada.', 404);
    this.name = 'NfseNotFoundError';
  }
}
