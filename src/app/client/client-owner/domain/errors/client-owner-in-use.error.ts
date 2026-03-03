import { AppException } from 'src/core/filters/app.exception';

export class ClientOwnerInUseError extends AppException {
  constructor() {
    super('Não é possível excluir o proprietário pois existem clientes vinculados.', 409);
    this.name = 'ClientOwnerInUseError';
  }
}
