import { AppException } from 'src/core/filters/app.exception';

export class CompanyNfsConfigNotFoundError extends AppException {
  constructor() {
    super('Configuração de NFS-e da empresa não encontrada.', 404);
    this.name = 'CompanyNfsConfigNotFoundError';
  }
}
