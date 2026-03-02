import { AppException } from 'src/core/filters/app.exception';

export class ClientNotActiveError extends AppException {
  constructor() {
    super('Cliente inativo.', 403);
    this.name = 'ClientNotActiveError';
  }
}
