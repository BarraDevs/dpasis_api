import { AppException } from 'src/core/filters/app.exception';

export class ClientSystemTypeAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um tipo de sistema de cliente com o nome: ${name}`, 409);
    this.name = 'ClientSystemTypeAlreadyExistsError';
  }
}
