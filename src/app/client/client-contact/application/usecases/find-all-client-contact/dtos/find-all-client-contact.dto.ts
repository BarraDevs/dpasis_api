import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllClientContactQueryDto extends Queries {
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @Trim()
  clientId: number;

  @IsOptional()
  @StringToNumber()
  @Trim()
  departmentId?: number;

  @IsOptional()
  @StringToBoolean()
  @IsBoolean({ message: '$property deve ser um booleano' })
  receiveNF?: boolean;
}
