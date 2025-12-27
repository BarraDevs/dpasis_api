import { AppException } from 'src/core/filters/app.exception';

export class ValueMustBePositiveError extends AppException {
  constructor() {
    super('Valor unitário deve ser maior que zero', 400);
    this.name = 'ValueMustBePositiveError';
  }
}
