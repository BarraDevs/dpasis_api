import { AppException } from 'src/core/filters/app.exception';

export class ResaleContactNotFoundError extends AppException {
  constructor() {
    super('Contato de revenda não encontrado na base de dados.', 404);
    this.name = 'ResaleContactNotFoundError';
  }
}
