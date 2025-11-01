import { AppException } from 'src/core/filters/app.exception';

export class InvalidPhoneError extends AppException {
  constructor() {
    super('Telefone inválido', 400);
    this.name = 'InvalidPhoneError';
  }
}
