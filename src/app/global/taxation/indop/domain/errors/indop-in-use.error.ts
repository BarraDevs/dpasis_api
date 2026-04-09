import { AppException } from 'src/core/filters/app.exception';

export class IndopInUseError extends AppException {
  constructor() {
    super('Não é possível excluir o INDOP pois existem combinações CNAE/NBS/INDOP vinculadas.', 409);
    this.name = 'IndopInUseError';
  }
}
