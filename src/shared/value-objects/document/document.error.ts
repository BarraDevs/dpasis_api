import { AppException } from 'src/core/filters/app.exception';

export class InvalidDocumentError extends AppException {
  constructor() {
    super('CPF/CNPJ inválido', 400);
    this.name = 'InvalidDocumentError';
  }
}
