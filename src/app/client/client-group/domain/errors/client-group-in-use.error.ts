import { AppException } from 'src/core/filters/app.exception';

export class ClientGroupInUseError extends AppException {
  constructor() {
    super('Não é possível excluir o grupo pois existem clientes vinculados.', 409);
    this.name = 'ClientGroupInUseError';
  }
}
