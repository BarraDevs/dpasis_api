import { AppException } from 'src/core/filters/app.exception';

export class ResaleContactAlreadyExistsError extends AppException {
  constructor(email: string) {
    super(`Já existe um contato com o email ${email} para esta revenda.`, 409);
    this.name = 'ResaleContactAlreadyExistsError';
  }
}
