import { AppException } from 'src/core/filters/app.exception';

export class BankInUseError extends AppException {
  constructor() {
    super('Não é possível excluir o banco pois existem configurações de fatura vinculadas.', 409);
    this.name = 'BankInUseError';
  }
}
