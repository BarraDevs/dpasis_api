import { AppException } from 'src/core/filters/app.exception';

export class EmailAlreadyTakenError extends AppException {
  constructor(email: string) {
    super(`O e-mail ${email} já está em uso.`, 409);
    this.name = 'EmailAlreadyTakenError';
  }
}
