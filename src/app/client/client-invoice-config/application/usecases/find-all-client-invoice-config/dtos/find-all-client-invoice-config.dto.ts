import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllClientInvoiceConfigQueryDto extends Queries {
  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @StringToNumber()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser entre 1 e 31' })
  @Max(31, { message: '$property deve ser entre 1 e 31' })
  dueDateDay?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @StringToBoolean()
  @IsBoolean({ message: '$property deve ser um booleano' })
  generateNf?: boolean;
}
