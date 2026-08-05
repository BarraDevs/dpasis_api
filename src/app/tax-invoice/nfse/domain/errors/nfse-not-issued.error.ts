import { AppException } from 'src/core/filters/app.exception';

export class NfseNotIssuedError extends AppException {
  constructor() {
    super('Nfse não está emitida e não pode ser cancelada.', 409);
    this.name = 'NfseNotIssuedError';
  }
}
