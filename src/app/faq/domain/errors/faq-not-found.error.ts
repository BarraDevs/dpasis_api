import { AppException } from 'src/core/filters/app.exception';

export class FaqNotFoundError extends AppException {
  constructor() {
    super('FAQ não encontrado na base de dados.', 404);
    this.name = 'FaqNotFoundError';
  }
}
