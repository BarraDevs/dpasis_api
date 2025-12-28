import { AppException } from 'src/core/filters/app.exception';

export class InvalidEmailError extends AppException {
  constructor(email: string) {
    super(`E-mail inválido: ${email}`, 400);
    this.name = 'InvalidEmailError';
  }
}
