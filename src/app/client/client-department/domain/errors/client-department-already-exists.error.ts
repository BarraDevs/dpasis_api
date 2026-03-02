import { AppException } from 'src/core/filters/app.exception';

export class ClientDepartmentAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um departamento de clientes com o nome: ${name}`, 409);
    this.name = 'ClientDepartmentAlreadyExistsError';
  }
}
