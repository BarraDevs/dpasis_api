import { AppException } from 'src/core/filters/app.exception';

export class ResaleDepartmentInUseError extends AppException {
  constructor() {
    super('Não é possível excluir o departamento pois existem contatos de revenda vinculados.', 409);
    this.name = 'ResaleDepartmentInUseError';
  }
}
