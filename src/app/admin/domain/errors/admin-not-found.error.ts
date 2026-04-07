import { AppException } from 'src/core/filters/app.exception';

export class AdminNotFoundError extends AppException {
  constructor() {
    super('Administrador não encontrado na base de dados.', 404);
    this.name = 'AdminNotFoundError';
  }
}
