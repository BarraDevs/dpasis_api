import { AppException } from 'src/core/filters/app.exception';

export class CompanyDuplicateDocumentError extends AppException {
  constructor() {
    super('CPF/CNPJ já cadastrado. Tente novamente com outro CPF/CNPJ.', 409);
    this.name = 'CompanyDuplicateDocumentError';
  }
}
