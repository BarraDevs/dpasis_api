import { AppException } from 'src/core/filters/app.exception';

export class DeadlineDaysRequiredError extends AppException {
  constructor() {
    super('Para tipo prazo, informe a quantidade de dias.', 400);
    this.name = 'DeadlineDaysRequiredError';
  }
}
