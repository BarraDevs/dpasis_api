import { AppException } from 'src/core/filters/app.exception';

export class InvalidCredentialError extends AppException {
  constructor() {
    super('Credenciais inválidas.', 400);
    this.name = 'InvalidCredentialError';
  }
}
