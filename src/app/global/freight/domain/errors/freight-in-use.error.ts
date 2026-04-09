import { AppException } from 'src/core/filters/app.exception';

export class FreightInUseError extends AppException {
  constructor() {
    super('Não é possível excluir o frete pois existem registros vinculados.', 409);
    this.name = 'FreightInUseError';
  }
}
