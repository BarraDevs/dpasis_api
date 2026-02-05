import { AppException } from 'src/core/filters/app.exception';

export class BudgetAlreadyHasOrderError extends AppException {
  constructor() {
    super('Este orçamento já possui um pedido vinculado', 400);
  }
}
