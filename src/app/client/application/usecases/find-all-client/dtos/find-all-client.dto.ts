import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllClientQueryDto extends OmitType(Queries, ['search']) {
  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  kind?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  cnpj?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  ie?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  group?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  type?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  companyName?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  fantasyName?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  owner?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  headquarters?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsArray({ message: '$property deve ser um array' })
  @IsString({ message: '$property deve ser um texto', each: true })
  @ArrayMinSize(1, { message: '$property deve ter ao menos $constraint1 item' })
  companyIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um valor booleano' })
  @StringToBoolean()
  active?: boolean;
}
