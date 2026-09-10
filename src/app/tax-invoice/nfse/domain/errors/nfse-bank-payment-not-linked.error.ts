import { AppException } from 'src/core/filters/app.exception';

/**
 * Reemitir desfaz o vínculo com uma cobrança que falhou. Sem cobrança vinculada não há o que
 * desfazer: o caminho é a emissão normal do boleto.
 */
export class NfseBankPaymentNotLinkedError extends AppException {
  constructor() {
    super('NFS-e sem boleto vinculado; para emitir, use POST /admin/bank-payment/nfm/:id.', 409);
    this.name = 'NfseBankPaymentNotLinkedError';
  }
}
