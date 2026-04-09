import { AppException } from 'src/core/filters/app.exception';

export class BankNotFoundError extends AppException {
  constructor() {
    super('Banco não encontrado na base de dados.', 404);
    this.name = 'BankNotFoundError';
  }
}
