import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllServiceCatalogQueryDto extends Queries {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  cnaeNbsIndopId?: number;
}
