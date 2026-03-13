import { AppException } from 'src/core/filters/app.exception';

export class ClientDriveTypeAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um tipo de drive de cliente com o nome: ${name}`, 409);
    this.name = 'ClientDriveTypeAlreadyExistsError';
  }
}
