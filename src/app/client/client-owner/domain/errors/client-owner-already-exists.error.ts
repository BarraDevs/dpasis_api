import { AppException } from 'src/core/filters/app.exception';

export class ClientOwnerAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um proprietário de clientes com o nome: ${name}`, 409);
    this.name = 'ClientOwnerAlreadyExistsError';
  }
}
