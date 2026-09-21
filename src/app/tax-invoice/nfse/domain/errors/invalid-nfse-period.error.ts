import { AppException } from 'src/core/filters/app.exception';

export class InvalidNfsePeriodError extends AppException {
  constructor() {
    super('startDate não pode ser posterior a endDate');
    this.name = 'InvalidNfsePeriodError';
  }
}
