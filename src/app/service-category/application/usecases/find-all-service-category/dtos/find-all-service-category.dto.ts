import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllServiceCategoryQueryDto extends Queries {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um valor booleano' })
  @StringToBoolean()
  active?: boolean;
}
