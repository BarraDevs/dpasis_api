import { AppException } from 'src/core/filters/app.exception';

export class ClientAlreadyExistsError extends AppException {
  constructor() {
    super('Cliente já cadastrado na base de dados.', 409);
    this.name = 'ClientAlreadyExistsError';
  }
}
