import { AppException } from 'src/core/filters/app.exception';

export class NfseAlreadyCanceledError extends AppException {
  constructor() {
    super('Nfse já está cancelada.', 409);
    this.name = 'NfseAlreadyCanceledError';
  }
}
