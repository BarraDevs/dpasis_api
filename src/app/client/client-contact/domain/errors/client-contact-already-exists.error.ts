import { AppException } from 'src/core/filters/app.exception';

export class ClientContactAlreadyExistsError extends AppException {
  constructor(email: string) {
    super(`Já existe um contato com o email ${email} para este cliente.`, 409);
    this.name = 'ClientContactAlreadyExistsError';
  }
}
