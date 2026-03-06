import { AppException } from 'src/core/filters/app.exception';

export class InvalidDueDateDayError extends AppException {
  constructor() {
    super('Dia de vencimento deve ser entre 1 e 31 e maior que o dia de emissão.', 400);
    this.name = 'InvalidDueDateDayError';
  }
}
