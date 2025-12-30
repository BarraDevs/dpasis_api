import { AppException } from 'src/core/filters/app.exception';

export class InvalidDateError extends AppException {
  constructor() {
    super('Data inválida', 400);
    this.name = 'InvalidDateError';
  }
};

export class InvalidDaysQuantityError extends AppException {
  constructor() {
    super('Quantidade de dias inválida', 400);
    this.name = 'InvalidDaysQuantityError';
  }
}

export class InvalidMonthsQuantityError extends AppException {
  constructor() {
    super('Quantidade de meses inválida', 400);
    this.name = 'InvalidMonthsQuantityError';
  }
}
