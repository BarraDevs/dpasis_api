import { AppException } from 'src/core/filters/app.exception';

export class BudgetNotApprovedError extends AppException {
  constructor() {
    super('Apenas orçamentos aprovados podem gerar pedidos', 400);
  }
}
