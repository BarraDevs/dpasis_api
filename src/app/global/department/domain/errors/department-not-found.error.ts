import { AppException } from 'src/core/filters/app.exception';

export class DepartmentNotFoundError extends AppException {
  constructor() {
    super('Departamento não encontrado na base de dados.', 404);
    this.name = 'DepartmentNotFoundError';
  }
}
