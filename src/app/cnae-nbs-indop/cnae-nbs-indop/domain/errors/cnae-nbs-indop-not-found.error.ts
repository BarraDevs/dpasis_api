import { AppException } from 'src/core/filters/app.exception';

export class CnaeNbsIndopNotFoundError extends AppException {
  constructor() {
    super('Combinação CNAE + NBS + INDOP não encontrada na base de dados.', 404);
    this.name = 'CnaeNbsIndopNotFoundError';
  }
}
