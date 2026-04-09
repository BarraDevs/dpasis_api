import { AppException } from 'src/core/filters/app.exception';

export class BilledNotFoundError extends AppException {
  constructor() {
    super('Faturado não encontrado na base de dados.', 404);
    this.name = 'BilledNotFoundError';
  }
}
