import { AppException } from 'src/core/filters/app.exception';

export class CompanyNfsConfigAlreadyExistsError extends AppException {
  constructor() {
    super('Empresa já possui configuração de NFS-e.', 409);
    this.name = 'CompanyNfsConfigAlreadyExistsError';
  }
}
