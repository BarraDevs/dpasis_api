import { AppException } from 'src/core/filters/app.exception';

export class InvalidCnpjError extends AppException {
  constructor() {
    super('CNPJ inválido', 400);
    this.name = 'InvalidCnpjError';
  }
}
