import { AppException } from 'src/core/filters/app.exception';

export class ClientSystemTypeInUseError extends AppException {
  constructor() {
    super('Não é possível excluir pois existem tipos de cliente vinculados.', 409);
    this.name = 'ClientSystemTypeInUseError';
  }
}
