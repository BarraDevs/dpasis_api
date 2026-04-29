import { AppException } from 'src/core/filters/app.exception';

export class ResaleDepartmentNotFoundError extends AppException {
  constructor() {
    super('Departamento de revenda não encontrado na base de dados.', 404);
    this.name = 'ResaleDepartmentNotFoundError';
  }
}
