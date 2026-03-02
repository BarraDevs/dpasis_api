import { AppException } from 'src/core/filters/app.exception';

export class ClientGroupAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um grupo de clientes com o nome: ${name}`, 409);
    this.name = 'ClientGroupAlreadyExistsError';
  }
}
