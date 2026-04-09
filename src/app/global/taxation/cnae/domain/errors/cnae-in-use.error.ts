import { AppException } from 'src/core/filters/app.exception';

export class CnaeInUseError extends AppException {
  constructor() {
    super('Não é possível excluir o CNAE pois existem combinações CNAE/NBS/INDOP vinculadas.', 409);
    this.name = 'CnaeInUseError';
  }
}
