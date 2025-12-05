import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class-*/dtos/queries/queries.dto';

export class FindAllProviderQueryDto extends Queries {
  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  name?: string;

  @ApiPropertyOptional()
  @IsEnum(ProviderType, { message: '$property deve ser um dos valores: ' + Object.values(ProviderType).join(', ') })
  @IsOptional()
  type?: ProviderType;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  cnpj?: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  ie?: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  companyName?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsArray({ message: '$property deve ser um array' })
  @IsString({ message: '$property deve ser um texto', each: true })
  @ArrayMinSize(1, { message: '$property deve ter ao menos $constraint1 item' })
  companyIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: '$property deve ser booleano' })
  active?: boolean;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  address?: string;
}
