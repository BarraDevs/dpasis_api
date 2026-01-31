import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';
import { BudgetStatus } from 'src/app/budget/enums/budget-status.enum';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllBudgetQueryDto extends OmitType(Queries, ['search']) {
  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  companyId?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  clientId?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  sellerId?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  shipperId?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  freightType?: string;

  @ApiPropertyOptional({ enum: BudgetStatus })
  @IsOptional()
  @IsEnum(BudgetStatus, { message: '$property deve ser um status válido' })
  status?: BudgetStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({}, { message: '$property deve ser uma data válida no formato ISO8601' })
  createdAtStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({}, { message: '$property deve ser uma data válida no formato ISO8601' })
  createdAtEnd?: string;
}
