import { AppException } from 'src/core/filters/app.exception';

export class NfseBankPaymentIssueFailedError extends AppException {
  constructor() {
    super('Não foi possível emitir o boleto. Verifique os logs de cobrança.');
    this.name = 'NfseBankPaymentIssueFailedError';
  }
}
