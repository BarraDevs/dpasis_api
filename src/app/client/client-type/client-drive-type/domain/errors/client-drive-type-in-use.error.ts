import { AppException } from 'src/core/filters/app.exception';

export class ClientDriveTypeInUseError extends AppException {
  constructor() {
    super('Não é possível excluir pois existem tipos de cliente vinculados.', 409);
    this.name = 'ClientDriveTypeInUseError';
  }
}
