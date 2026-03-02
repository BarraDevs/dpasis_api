import { AppException } from 'src/core/filters/app.exception';

export class ClientAddressNotFoundError extends AppException {
  constructor() {
    super('ClientAddress não encontrado.', 404);
    this.name = 'ClientAddressNotFoundError';
  }
}
