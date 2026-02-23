import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CnpjLookupInputDto {
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  cnpj: string;
}
