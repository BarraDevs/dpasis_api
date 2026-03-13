import { AppException } from 'src/core/filters/app.exception';

export class ClientDriveTypeNotFoundError extends AppException {
  constructor() {
    super('Tipo de drive de cliente não encontrado na base de dados.', 404);
    this.name = 'ClientDriveTypeNotFoundError';
  }
}
