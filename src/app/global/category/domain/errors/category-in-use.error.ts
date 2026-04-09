import { AppException } from 'src/core/filters/app.exception';

export class CategoryInUseError extends AppException {
  constructor() {
    super('Não é possível excluir a categoria pois existem registros vinculados.', 409);
    this.name = 'CategoryInUseError';
  }
}
