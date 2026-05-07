import { AppException } from 'src/core/filters/app.exception';
import { HexadecimalDecimal } from 'src/shared/value-objects/hexadecimal-decimal/hexadecimal-decimal.vo';

export class ResaleIdAlreadyTakenError extends AppException {
  constructor(id: number) {
    const hex = HexadecimalDecimal.fromDecimal(id).hex;
    super(`O id ${hex} já está em uso.`, 409);
    this.name = 'ResaleIdAlreadyTakenError';
  }
}
