import { AppException } from 'src/core/filters/app.exception';

export class OwnerNotActiveError extends AppException {
  constructor() {
    super('Proprietário não está ativo', 400);
    this.name = 'OwnerNotActiveError';
  }
}
