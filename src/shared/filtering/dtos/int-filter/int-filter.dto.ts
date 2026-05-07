import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsOptional } from 'class-validator';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';

export class IntFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  eq?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  ne?: number;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray({ message: '$property deve ser um array' })
  @IsInt({ each: true, message: 'cada item de $property deve ser um número inteiro' })
  in?: number[];

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray({ message: '$property deve ser um array' })
  @IsInt({ each: true, message: 'cada item de $property deve ser um número inteiro' })
  notIn?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  gt?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  gte?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  lt?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  lte?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  isNull?: boolean;
}
