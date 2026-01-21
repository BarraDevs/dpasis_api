import { AppException } from 'src/core/filters/app.exception';

export class CompanyNotActiveError extends AppException {
  constructor(fantasyName?: string) {
    super(`Empresa ${fantasyName ?? ''} não está ativa`, 400);
    this.name = 'CompanyNotActiveError';
  }
}
