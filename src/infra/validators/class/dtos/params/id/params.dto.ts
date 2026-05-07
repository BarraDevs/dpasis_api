import { IsInt, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { StringToNumber } from '../../../decorators/string-number/string-number';

export class Params {
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: '$property deve ser um número' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  id: number;
}
