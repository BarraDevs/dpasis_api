import { AppException } from 'src/core/filters/app.exception';

export class NbsInUseError extends AppException {
  constructor() {
    super('Não é possível excluir o NBS pois existem combinações CNAE/NBS/INDOP vinculadas.', 409);
    this.name = 'NbsInUseError';
  }
}
