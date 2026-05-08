import { AppException } from 'src/core/filters/app.exception';

export class DueDateIsLessThanEmissionDayError extends AppException {
  constructor() {
    super('Data de vencimento deve ser maior que a data de emissão.', 400);
    this.name = 'DueDateIsLessThanEmissionDayError';
  }
}

export class DueDateIsLessThanMinimumIntervalBetweenEmissionDayAndDueDateDayError extends AppException {
  constructor() {
    super('Data de vencimento deve ser maior que 15 dias após a data de emissão.', 400);
    this.name = 'DueDateIsLessThanMinimumIntervalBetweenEmissionDayAndDueDateDayError';
  }
}
