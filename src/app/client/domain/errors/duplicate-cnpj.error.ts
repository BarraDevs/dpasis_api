import { AppException } from 'src/core/filters/app.exception';

export class ClientDuplicateCnpjError extends AppException {
  constructor() {
    super('CNPJ já cadastrado. Tente novamente com outro CNPJ.', 409);
    this.name = 'ClientDuplicateCnpjError';
  }
}
