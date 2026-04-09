import { AppException } from 'src/core/filters/app.exception';

export class AdminCannotBeInactiveError extends AppException {
  constructor() {
    super('Administrador não pode ser inativado.', 400);
    this.name = 'AdminCannotBeInactiveError';
  }
}
