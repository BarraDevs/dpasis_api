import { IsNotEmpty } from 'class-validator';
import { Trim } from '../../decorators/trim/trim';
import { StringToNumber } from '../../decorators/string-number/string-number';

export class Params {
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @Trim()
  id: number;
}
