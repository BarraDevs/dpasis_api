import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class-*/dtos/queries/queries.dto';

export class FindAllClientQueryDto extends Queries {
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
}
