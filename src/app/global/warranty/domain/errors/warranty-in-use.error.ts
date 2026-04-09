import { AppException } from 'src/core/filters/app.exception';

export class WarrantyInUseError extends AppException {
  constructor() {
    super('Não é possível excluir a garantia pois existem registros vinculados.', 409);
    this.name = 'WarrantyInUseError';
  }
}
