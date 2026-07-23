import { AppException } from 'src/core/filters/app.exception';

export class NfseAlreadyIssuedError extends AppException {
  constructor() {
    super('Nfse já foi emitida e não pode ser alterada.', 409);
    this.name = 'NfseAlreadyIssuedError';
  }
}
