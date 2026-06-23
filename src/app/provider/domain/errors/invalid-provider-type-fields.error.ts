import { AppException } from 'src/core/filters/app.exception';

export class InvalidProviderTypeFieldsError extends AppException {
  constructor() {
    super('Campos condicionais inválidos para o tipo do prestador.', 400);
    this.name = 'InvalidProviderTypeFieldsError';
  }
}
