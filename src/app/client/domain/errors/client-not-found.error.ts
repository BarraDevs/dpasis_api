import { AppException } from 'src/core/filters/app.exception';

export class ClientNotFoundError extends AppException {
  constructor() {
    super('Client não encontrado.', 404);
    this.name = 'ClientNotFoundError';
  }
}
