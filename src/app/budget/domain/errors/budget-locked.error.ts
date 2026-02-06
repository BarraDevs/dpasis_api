import { AppException } from 'src/core/filters/app.exception';

export class BudgetLockedError extends AppException {
  constructor() {
    super('Orçamento não pode ser editado pois já possui um pedido vinculado', 409);
  }
}
