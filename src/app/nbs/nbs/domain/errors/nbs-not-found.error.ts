import { AppException } from 'src/core/filters/app.exception';

export class NbsNotFoundError extends AppException {
  constructor() {
    super('NBS não encontrado na base de dados.', 404);
    this.name = 'NbsNotFoundError';
  }
}
