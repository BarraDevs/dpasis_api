import { AppException } from 'src/core/filters/app.exception';

export class InvalidHexadecimalStringError extends AppException {
  constructor() {
    super('Valor hexadecimal inválido. Informe de 1 a 8 caracteres usando apenas 0-9 e A-F.', 400);
    this.name = 'InvalidHexadecimalStringError';
  }
}

export class DecimalOutOfHexadecimalRangeError extends AppException {
  constructor() {
    super('Valor decimal fora do intervalo permitido para hexadecimal de até 8 caracteres (0 a 4294967295).', 400);
    this.name = 'DecimalOutOfHexadecimalRangeError';
  }
}
