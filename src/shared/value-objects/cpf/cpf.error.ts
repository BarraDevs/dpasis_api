import { AppException } from 'src/core/filters/app.exception';

export class InvalidCpfError extends AppException {
  constructor() {
    super('CPF inválido', 400);
    this.name = 'InvalidCpfError';
  }
}
