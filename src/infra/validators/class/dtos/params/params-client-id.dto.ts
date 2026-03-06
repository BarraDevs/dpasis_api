import { IsNotEmpty } from 'class-validator';
import { StringToNumber } from '../../decorators/string-number/string-number';
import { Trim } from '../../decorators/trim/trim';

export class ParamsClientId {
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @Trim()
  clientId: number;
}
