import { AppException } from 'src/core/filters/app.exception';

export class InvalidMonthError extends AppException {
  constructor() {
    super('Mês deve ser entre 1 e 12.', 400);
    this.name = 'InvalidMonthError';
  }
}
