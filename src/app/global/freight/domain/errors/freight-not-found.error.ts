import { AppException } from 'src/core/filters/app.exception';

export class FreightNotFoundError extends AppException {
  constructor() {
    super('Frete não encontrado na base de dados.', 404);
    this.name = 'FreightNotFoundError';
  }
}
