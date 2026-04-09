import { AppException } from 'src/core/filters/app.exception';

export class DeliveryTermInUseError extends AppException {
  constructor() {
    super('Não é possível excluir o prazo de entrega pois existem registros vinculados.', 409);
    this.name = 'DeliveryTermInUseError';
  }
}
