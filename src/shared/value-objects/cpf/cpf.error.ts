import { AppException } from 'src/core/filters/app.exception';

export class InvalidCpfError extends AppException {
  constructor(cpf: string) {
    super(`CPF inválido: ${cpf}`, 400);
    this.name = 'InvalidCpfError';
  }
}
