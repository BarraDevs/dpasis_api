import { AppException } from 'src/core/filters/app.exception';

export class ContactNotFoundError extends AppException {
  constructor() {
    super('Contato não encontrado na base de dados', 404);
    this.name = 'ContactNotFoundError';
  }
}
