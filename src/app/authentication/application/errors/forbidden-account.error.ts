import { AppException } from 'src/core/filters/app.exception';

export class ForbiddenAccountError extends AppException {
  constructor() {
    super('Acesso negado.', 403);
    this.name = 'ForbiddenAccountError';
  }
}
