import { AppException } from 'src/core/filters/app.exception';

export class ResaleDepartmentAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um departamento de revenda com o nome: ${name}`, 409);
    this.name = 'ResaleDepartmentAlreadyExistsError';
  }
}
