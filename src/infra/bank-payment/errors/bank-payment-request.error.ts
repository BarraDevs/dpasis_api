import { AppException } from 'src/core/filters/app.exception';

export class BankPaymentRequestError extends AppException {
  constructor(message = 'Requisição inválida na API de cobrança bancária.') {
    super(message, 400);
    this.name = 'BankPaymentRequestError';
  }
}
