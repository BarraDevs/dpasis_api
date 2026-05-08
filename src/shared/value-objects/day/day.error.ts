import { AppException } from 'src/core/filters/app.exception';

export class InvalidDayError extends AppException {
  constructor() {
    super('Dia deve ser entre 1 e 31.', 400);
    this.name = 'InvalidDayError';
  }
}
