import { AppException } from 'src/core/filters/app.exception';

export class DepartmentAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um departamento com o nome: ${name}`, 409);
    this.name = 'DepartmentAlreadyExistsError';
  }
}
