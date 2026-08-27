import { AppException } from 'src/core/filters/app.exception';

export class BankPaymentNotFoundError extends AppException {
  constructor(requestCode?: string) {
    super(
      requestCode
        ? `Cobrança bancária não encontrada: ${requestCode}.`
        : 'Cobrança bancária não encontrada.',
      404,
    );
    this.name = 'BankPaymentNotFoundError';
  }
}
