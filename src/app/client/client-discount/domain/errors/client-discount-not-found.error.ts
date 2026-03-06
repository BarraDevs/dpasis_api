import { AppException } from 'src/core/filters/app.exception';

export class ClientDiscountNotFoundError extends AppException {
  constructor() {
    super('Desconto não encontrado na base de dados.', 404);
    this.name = 'ClientDiscountNotFoundError';
  }
}
