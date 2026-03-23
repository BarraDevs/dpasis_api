import { AppException } from 'src/core/filters/app.exception';

export class CnaeNbsIndopInUseError extends AppException {
  constructor() {
    super('Não é possível excluir a combinação pois existem itens de cliente vinculados.', 409);
    this.name = 'CnaeNbsIndopInUseError';
  }
}
