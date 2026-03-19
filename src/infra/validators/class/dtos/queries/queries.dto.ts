import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { StringToBoolean } from '../../decorators/string-boolean/string-boolean';
import { StringToNumber } from '../../decorators/string-number/string-number';
import { Trim } from '../../decorators/trim/trim';

export class Queries {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  size?: number;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  active?: boolean;
}
