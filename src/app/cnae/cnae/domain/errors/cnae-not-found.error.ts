import { AppException } from 'src/core/filters/app.exception';

export class CnaeNotFoundError extends AppException {
  constructor() {
    super('CNAE não encontrado na base de dados.', 404);
    this.name = 'CnaeNotFoundError';
  }
}
