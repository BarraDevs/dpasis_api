import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllClientQueryDto extends OmitType(Queries, ['search']) {
  @ApiPropertyOptional({ description: 'Filtro parcial por razão social (case-insensitive)' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Filtro parcial por nome fantasia (case-insensitive)' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  fantasyName?: string;

  @ApiPropertyOptional({ description: 'Filtro parcial por nome social (case-insensitive)' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  socialName?: string;

  @ApiPropertyOptional({ description: 'Filtro parcial por documento (case-insensitive)' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  document?: string;

  @ApiPropertyOptional({ description: 'Filtro parcial por sede/matriz (case-insensitive)' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  headquarters?: string;

  @ApiPropertyOptional({ description: 'Filtro parcial por domínio (case-insensitive)' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  @MaxLength(128, { message: '$property deve ter no máximo 128 caracteres' })
  domain?: string;

  @ApiPropertyOptional({ description: 'Filtro parcial por inscrição estadual (case-insensitive)' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  ie?: string;
}
