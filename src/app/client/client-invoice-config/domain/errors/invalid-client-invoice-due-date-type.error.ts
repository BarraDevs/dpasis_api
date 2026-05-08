import { AppException } from 'src/core/filters/app.exception';

export class InvalidClientInvoiceDueDateTypeError extends AppException {
  constructor() {
    super('Tipo de data de vencimento inválido.', 400);
    this.name = 'InvalidClientInvoiceDueDateTypeError';
  }
}
