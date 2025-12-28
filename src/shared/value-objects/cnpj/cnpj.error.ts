import { AppException } from 'src/core/filters/app.exception';

export class InvalidCnpjError extends AppException {
  constructor(cnpj: string) {
    super(`CNPJ inválido: ${cnpj}`, 400);
    this.name = 'InvalidCnpjError';
  }
}
