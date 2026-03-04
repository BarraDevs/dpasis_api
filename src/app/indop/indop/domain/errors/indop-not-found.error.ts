import { AppException } from 'src/core/filters/app.exception';

export class IndopNotFoundError extends AppException {
  constructor() {
    super('INDOP não encontrado na base de dados.', 404);
    this.name = 'IndopNotFoundError';
  }
}
