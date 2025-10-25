import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class-*/dtos/queries/queries.dto';

export class FindAllClientQueryDto extends Queries {
  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  companyName?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  cnpj?: string;
}
