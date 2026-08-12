import { AppException } from 'src/core/filters/app.exception';

export class InvalidNfmInvoiceQueryError extends AppException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNfmInvoiceQueryError';
  }
}
