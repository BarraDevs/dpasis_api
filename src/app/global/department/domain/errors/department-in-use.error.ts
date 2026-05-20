import { AppException } from 'src/core/filters/app.exception';

export class DepartmentInUseError extends AppException {
  constructor() {
    super('Não é possível excluir o departamento pois existem contatos vinculados.', 409);
    this.name = 'DepartmentInUseError';
  }
}
