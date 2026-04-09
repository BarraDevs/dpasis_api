import { AppException } from 'src/core/filters/app.exception';

export class BilledInUseError extends AppException {
  constructor() {
    super('Não é possível excluir o faturado pois existem registros vinculados.', 409);
    this.name = 'BilledInUseError';
  }
}
