import { AppException } from 'src/core/filters/app.exception';

export class InvalidProviderTypeError extends AppException {
  constructor() {
    super('Tipo de prestador inválido', 400);
    this.name = 'InvalidProviderTypeError';
  }
}
