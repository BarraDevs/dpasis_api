import { AppException } from 'src/core/filters/app.exception';

export class InvalidPhoneError extends AppException {
  constructor(phone: string) {
    super(`Telefone inválido: ${phone}`, 400);
    this.name = 'InvalidPhoneError';
  }
}
