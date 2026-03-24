import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllServiceAttendanceValueQueryDto extends Queries {
  @ApiProperty()
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  @Trim()
  serviceId: number;
}
