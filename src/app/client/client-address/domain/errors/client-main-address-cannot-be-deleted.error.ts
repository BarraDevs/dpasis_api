import { AppException } from 'src/core/filters/app.exception';

export class ClientMainAddressCannotBeDeletedError extends AppException {
  constructor() {
    super('Endereço principal não pode ser excluído.', 400);
    this.name = 'ClientMainAddressCannotBeDeletedError';
  }
}
