import { AppException } from 'src/core/filters/app.exception';

export class CnaeNbsIndopInUseError extends AppException {
  constructor() {
    super('Não é possível excluir a combinação pois existem registros vinculados.', 409);
    this.name = 'CnaeNbsIndopInUseError';
  }
}
