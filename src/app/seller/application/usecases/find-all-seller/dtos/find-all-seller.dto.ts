import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class-*/dtos/queries/queries.dto';

export class FindAllSellerQueryDto extends Queries {
  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  name?: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  nickname?: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  email?: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  phone?: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  cellphone?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsArray({ message: '$property deve ser um array' })
  @IsString({ message: '$property deve ser uma string', each: true })
  @ArrayMinSize(1, { message: '$property deve ter ao menos $constraint1 item' })
  companyIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: '$property deve ser booleano' })
  active?: boolean;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  address?: string;
}
