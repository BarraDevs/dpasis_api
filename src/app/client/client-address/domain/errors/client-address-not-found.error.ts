import { AppException } from 'src/core/filters/app.exception';

export class ClientAddressNotFoundError extends AppException {
  constructor() {
    super('Endereço do cliente não encontrado.', 404);
    this.name = 'ClientAddressNotFoundError';
  }
}
