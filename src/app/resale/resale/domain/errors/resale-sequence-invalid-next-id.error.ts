import { AppException } from 'src/core/filters/app.exception';
import { HexadecimalDecimal } from 'src/shared/value-objects/hexadecimal-decimal/hexadecimal-decimal.vo';

export class ResaleSequenceInvalidNextIdError extends AppException {
  constructor(nextId: number, maxId: number) {
    const nextHex = HexadecimalDecimal.fromDecimal(nextId).hex;
    const maxHex = HexadecimalDecimal.fromDecimal(maxId).hex;
    super(
      `O próximo ID ${nextHex} é inválido. O maior ID de revenda existente é ${maxHex}; o novo próximo ID deve ser maior que ${maxHex}.`,
      422,
    );
    this.name = 'ResaleSequenceInvalidNextIdError';
  }
}
