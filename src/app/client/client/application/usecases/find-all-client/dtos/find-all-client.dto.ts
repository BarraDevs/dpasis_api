import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllClientQueryDto extends Queries {
  @ApiPropertyOptional({ description: 'Filtra por tipo: true = sub-clientes, false = clientes raiz' })
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  isSubClient?: boolean;
}
