import { AppException } from 'src/core/filters/app.exception';

export class QuantityMustBePositiveError extends AppException {
  constructor() {
    super('Quantidade deve ser maior que zero', 400);
    this.name = 'QuantityMustBePositiveError';
  }
}
