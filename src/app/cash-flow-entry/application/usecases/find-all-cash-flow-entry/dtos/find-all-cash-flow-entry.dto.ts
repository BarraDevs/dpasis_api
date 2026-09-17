import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllCashFlowEntryQueryDto extends Queries {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  @Trim()
  companyId: number;

  @ApiPropertyOptional({ example: '2026-09-01', description: 'Data inicial do lançamento (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: '$property deve ser uma data válida no formato ISO 8601' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30', description: 'Data final do lançamento (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: '$property deve ser uma data válida no formato ISO 8601' })
  endDate?: string;

  @ApiPropertyOptional({ enum: CashFlowEntryType, example: CashFlowEntryType.CREDIT })
  @IsOptional()
  @IsEnum(CashFlowEntryType, { message: '$property deve ser CREDIT ou DEBIT' })
  type?: CashFlowEntryType;
}
