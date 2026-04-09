import { AppException } from 'src/core/filters/app.exception';

export class WarrantyInUseError extends AppException {
  constructor() {
    super('Não é possível excluir pois existem serviços vinculados.', 409);
    this.name = 'WarrantyInUseError';
  }
}
