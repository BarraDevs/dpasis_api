import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsUnsigned32HexString } from 'src/infra/validators/class/decorators/unsigned-32-hex-string/is-unsigned-32-hex-string';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllResaleContactQueryDto extends Queries {
  @ApiProperty({ example: '43', description: 'ID da revenda em hexadecimal.' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  @IsUnsigned32HexString()
  resaleId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @StringToNumber()
  @Trim()
  departmentId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @StringToBoolean()
  @IsBoolean({ message: '$property deve ser um booleano' })
  receiveNF?: boolean;
}

export type FindAllResaleContactExecuteQuery = Omit<FindAllResaleContactQueryDto, 'resaleId'> & {
  resaleId: number;
};
