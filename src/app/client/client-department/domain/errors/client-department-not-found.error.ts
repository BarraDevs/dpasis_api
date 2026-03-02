import { AppException } from 'src/core/filters/app.exception';

export class ClientDepartmentNotFoundError extends AppException {
  constructor() {
    super('Departamento de clientes não encontrado na base de dados.', 404);
    this.name = 'ClientDepartmentNotFoundError';
  }
}
