import { AppException } from 'src/core/filters/app.exception';

export class CompanyNotFoundError extends AppException {
  constructor() {
    super('Empresa não encontrada na base de dados.', 404);
    this.name = 'CompanyNotFoundError';
  }
}
