import { AppException } from 'src/core/filters/app.exception';

export class CnaeNbsIndopAlreadyExistsError extends AppException {
  constructor() {
    super('Já existe uma combinação CNAE + NBS + INDOP com esses valores.', 409);
    this.name = 'CnaeNbsIndopAlreadyExistsError';
  }
}
