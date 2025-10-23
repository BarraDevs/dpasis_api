export class InvalidDateError extends Error {
  constructor() {
    super('Data inválida');
    this.name = 'InvalidDateError';
  }
};

export class InvalidDaysQuantityError extends Error {
  constructor() {
    super('Quantidade de dias inválida');
    this.name = 'InvalidDaysQuantityError';
  }
}

export class InvalidMonthsQuantityError extends Error {
  constructor() {
    super('Quantidade de meses inválida');
    this.name = 'InvalidMonthsQuantityError';
  }
}
