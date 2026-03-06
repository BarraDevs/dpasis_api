import { AppException } from 'src/core/filters/app.exception';

export class ClientInvoiceConfigAlreadyExistsError extends AppException {
  constructor() {
    super('Cliente já possui configuração de NF e boleto.', 409);
    this.name = 'ClientInvoiceConfigAlreadyExistsError';
  }
}
