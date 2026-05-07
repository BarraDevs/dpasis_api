import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';

export class BooleanFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  eq?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  isNull?: boolean;
}
