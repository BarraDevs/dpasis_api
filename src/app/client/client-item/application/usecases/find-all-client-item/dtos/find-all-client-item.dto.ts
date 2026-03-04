import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllClientItemQueryDto extends Queries {
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @Trim()
  clientId: number;

  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  cnaeId?: number;

  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  nbsId?: number;

  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  indopId?: number;
}
