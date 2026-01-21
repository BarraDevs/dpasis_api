import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllServiceQueryDto extends Queries {
  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  companyId?: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um valor booleano' })
  active?: boolean;

  @ApiPropertyOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  productId?: string;
}
