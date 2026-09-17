import { AppException } from 'src/core/filters/app.exception';

export class CashFlowEntryNotFoundError extends AppException {
  constructor() {
    super('Lançamento de fluxo de caixa não encontrado na base de dados.', 404);
    this.name = 'CashFlowEntryNotFoundError';
  }
}
