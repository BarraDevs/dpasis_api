import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class StringFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  eq?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  ne?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray({ message: '$property deve ser um array' })
  @IsString({ each: true, message: 'cada item de $property deve ser um texto' })
  in?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray({ message: '$property deve ser um array' })
  @IsString({ each: true, message: 'cada item de $property deve ser um texto' })
  notIn?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  contains?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  startsWith?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  endsWith?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  isNull?: boolean;
}
