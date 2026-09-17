import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateCashFlowEntryInputDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  @Trim()
  companyId: number;

  @ApiProperty({ enum: CashFlowEntryType, example: CashFlowEntryType.CREDIT })
  @IsEnum(CashFlowEntryType, { message: '$property deve ser CREDIT ou DEBIT' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  type: CashFlowEntryType;

  @ApiProperty({ example: 15050, description: 'Valor em centavos' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior que zero' })
  @StringToNumber()
  amountInCents: number;

  @ApiProperty({ example: '2026-09-17T12:00:00.000Z', description: 'Data do lançamento (ISO 8601)' })
  @IsDateString({}, { message: '$property deve ser uma data válida no formato ISO 8601' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  occurredAt: string;

  @ApiProperty({ example: 'Pagamento de boleto NFS-e 123' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(8192, { message: '$property deve ter no máximo 8192 caracteres' })
  @Trim()
  description: string;
}

export class CreateCashFlowEntryOutputDto {
  id: number;
}
