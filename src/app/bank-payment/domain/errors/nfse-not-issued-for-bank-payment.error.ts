import { AppException } from 'src/core/filters/app.exception';

export class NfseNotIssuedForBankPaymentError extends AppException {
  constructor() {
    super('NFS-e da NFM não está emitida.', 409);
    this.name = 'NfseNotIssuedForBankPaymentError';
  }
}
