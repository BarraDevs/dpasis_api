import { AppException } from 'src/core/filters/app.exception';

export class ResaleNotFoundError extends AppException {
  constructor() {
    super('Revenda não encontrada na base de dados.', 404);
    this.name = 'ResaleNotFoundError';
  }
}
