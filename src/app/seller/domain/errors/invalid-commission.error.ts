import { AppException } from 'src/core/filters/app.exception';

export class InvalidCommissionError extends AppException {
  constructor() {
    super('A comissão deve estar entre 0 e 100', 400);
  }
}

