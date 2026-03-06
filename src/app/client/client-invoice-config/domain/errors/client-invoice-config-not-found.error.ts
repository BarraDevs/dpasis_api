import { AppException } from 'src/core/filters/app.exception';

export class ClientInvoiceConfigNotFoundError extends AppException {
  constructor() {
    super('Configuração de NF e boleto não encontrada.', 404);
    this.name = 'ClientInvoiceConfigNotFoundError';
  }
}
