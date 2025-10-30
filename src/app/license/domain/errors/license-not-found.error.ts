import { AppException } from 'src/core/filters/app.exception';

export class LicenseNotFoundError extends AppException {
  constructor() {
    super('Licença não encontrada na base de dados', 404);
    this.name = 'LicenseNotFoundError';
  }
}
