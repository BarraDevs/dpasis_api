import { AppException } from 'src/core/filters/app.exception';

export class CategoryNotFoundError extends AppException {
  constructor() {
    super('Categoria não encontrada na base de dados.', 404);
    this.name = 'CategoryNotFoundError';
  }
}
