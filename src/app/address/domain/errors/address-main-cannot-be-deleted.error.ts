import { AppException } from 'src/core/filters/app.exception';

export class AddressMainCannotBeDeletedError extends AppException {
  constructor() {
    super('Endereço principal não pode ser excluído', 403);
    this.name = 'AddressMainCannotBeDeletedError';
  }
}
