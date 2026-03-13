import { AppException } from 'src/core/filters/app.exception';

export class ClientDescriptionTypeNotFoundError extends AppException {
  constructor() {
    super('Tipo de descrição de cliente não encontrado na base de dados.', 404);
    this.name = 'ClientDescriptionTypeNotFoundError';
  }
}
