import { AppException } from 'src/core/filters/app.exception';

export class InvalidBillingMonthsError extends AppException {
  constructor() {
    super('Para tipo anual, informe ao menos um mês (1-12).', 400);
    this.name = 'InvalidBillingMonthsError';
  }
}
