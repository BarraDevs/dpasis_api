import { AppException } from 'src/core/filters/app.exception';

export class OwnerNotFoundError extends AppException {
  constructor() {
    super('Proprietário não encontrado na base de dados', 404);
    this.name = 'OwnerNotFoundError';
  }
}
