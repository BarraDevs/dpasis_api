import { AppException } from 'src/core/filters/app.exception';

export class InvalidExpirationTimeError extends AppException {
  constructor() {
    super('Tempo de expiração inválido', 400);
    this.name = 'InvalidExpirationTimeError';
  }
}
