import { AppException } from 'src/core/filters/app.exception';

export class HonorificNotFoundError extends AppException {
  constructor() {
    super('Pronome de tratamento não encontrado na base de dados.', 404);
    this.name = 'HonorificNotFoundError';
  }
}
