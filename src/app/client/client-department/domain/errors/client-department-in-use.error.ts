import { AppException } from 'src/core/filters/app.exception';

export class ClientDepartmentInUseError extends AppException {
  constructor() {
    super('Não é possível excluir o departamento pois existem contatos vinculados.', 409);
    this.name = 'ClientDepartmentInUseError';
  }
}
