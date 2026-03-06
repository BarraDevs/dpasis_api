import { AppException } from 'src/core/filters/app.exception';

export class InvalidDiscountValueError extends AppException {
  constructor(value: number, type: string) {
    const message =
      type === 'percentage'
        ? `O valor do desconto percentual deve estar entre 0 e 10000 (ex: 10,50% = 1050). Valor recebido: ${value}`
        : `O valor do desconto monetário deve ser maior ou igual a 0 (em centavos). Valor recebido: ${value}`;
    super(message, 400);
    this.name = 'InvalidDiscountValueError';
  }
}
