import { AppException } from 'src/core/filters/app.exception';

export class NfseBankPaymentAlreadyLinkedError extends AppException {
  constructor() {
    super('NFS-e já possui boleto vinculado.', 409);
    this.name = 'NfseBankPaymentAlreadyLinkedError';
  }
}
