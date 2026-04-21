import { AppException } from 'src/core/filters/app.exception';

export class ResaleNotActiveError extends AppException {
  constructor() {
    super('Revenda inativa.', 403);
    this.name = 'ResaleNotActiveError';
  }
}
