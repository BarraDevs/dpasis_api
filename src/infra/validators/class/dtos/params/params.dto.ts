import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../decorators/trim/trim';

export class Params {
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  id: string;
}
