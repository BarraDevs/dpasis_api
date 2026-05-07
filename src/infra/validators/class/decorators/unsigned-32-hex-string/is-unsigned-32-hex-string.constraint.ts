import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { HexadecimalDecimal } from 'src/shared/value-objects/hexadecimal-decimal/hexadecimal-decimal.vo';

const HEX_VALIDATION_MESSAGE =
  'Valor hexadecimal inválido. Informe de 1 a 8 caracteres usando apenas 0-9 e A-F (opcionalmente prefixo 0x).';

@ValidatorConstraint({ name: 'IsUnsigned32HexString', async: false })
export class IsUnsigned32HexStringConstraint implements ValidatorConstraintInterface {
  public validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    try {
      HexadecimalDecimal.fromHex(value);
      return true;
    } catch {
      return false;
    }
  }

  public defaultMessage(): string {
    return HEX_VALIDATION_MESSAGE;
  }
}
