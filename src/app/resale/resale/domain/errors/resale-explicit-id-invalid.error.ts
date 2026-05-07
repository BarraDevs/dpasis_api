import { AppException } from 'src/core/filters/app.exception';

export class ResaleExplicitIdInvalidError extends AppException {
  constructor() {
    super('O id opcional deve ser um número inteiro positivo.', 400);
    this.name = 'ResaleExplicitIdInvalidError';
  }
}
