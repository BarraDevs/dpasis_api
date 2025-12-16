import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllProductQueryDto extends Queries {
  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  companyId: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  type?: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  group01?: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  group02?: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  description?: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  manufacturerCode?: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  brand?: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  ncm?: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  ean?: string;
}
