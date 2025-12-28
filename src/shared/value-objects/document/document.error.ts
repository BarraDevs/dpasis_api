import { AppException } from 'src/core/filters/app.exception';

export class InvalidDocumentError extends AppException {
  constructor(document: string) {
    super(`CPF/CNPJ inválido: ${document}`, 400);
    this.name = 'InvalidDocumentError';
  }
}
