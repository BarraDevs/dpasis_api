import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Matches, MaxLength } from 'class-validator';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllBankPaymentQueryDto extends Queries {
  @ApiProperty({ enum: BankPaymentProvider, example: BankPaymentProvider.INTER })
  @IsEnum(BankPaymentProvider, { message: '$property deve ser um provedor válido' })
  provider: BankPaymentProvider;

  @ApiProperty({ example: 1, description: 'Banco cujas credenciais Inter serão usadas' })
  @StringToNumber()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser positivo' })
  bankId: number;

  @ApiProperty({ example: '2026-01-01', description: 'Data inicial no formato YYYY-MM-DD' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '$property deve estar no formato YYYY-MM-DD' })
  @Trim()
  startDate: string;

  @ApiProperty({ example: '2026-01-31', description: 'Data final no formato YYYY-MM-DD' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '$property deve estar no formato YYYY-MM-DD' })
  @Trim()
  endDate: string;

  @ApiPropertyOptional({ enum: BankPaymentStatus, example: BankPaymentStatus.EMITTED })
  @IsOptional()
  @IsEnum(BankPaymentStatus, { message: '$property deve ser uma situação válida' })
  status?: BankPaymentStatus;

  @ApiPropertyOptional({ example: 'João da Silva' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(100, { message: '$property deve ter no máximo 100 caracteres' })
  @Trim()
  payerName?: string;

  @ApiPropertyOptional({ example: '11122233344' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(18, { message: '$property deve ter no máximo 18 caracteres' })
  @Trim()
  payerDocument?: string;
}
