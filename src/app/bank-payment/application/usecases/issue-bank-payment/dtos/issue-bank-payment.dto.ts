import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { BankPaymentPersonType } from 'src/infra/bank-payment/enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { IssueBankPaymentOutputDto as GatewayIssueOutput } from 'src/infra/bank-payment/dtos/issue-bank-payment.dto';

export class IssueBankPaymentPayerInputDto {
  @ApiProperty({ example: '11122233344' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(18, { message: '$property deve ter no máximo 18 caracteres' })
  @Trim()
  document: string;

  @ApiProperty({ enum: BankPaymentPersonType, example: BankPaymentPersonType.INDIVIDUAL })
  @IsEnum(BankPaymentPersonType, { message: '$property deve ser INDIVIDUAL ou COMPANY' })
  personType: BankPaymentPersonType;

  @ApiProperty({ example: 'João da Silva' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(100, { message: '$property deve ter no máximo 100 caracteres' })
  @Trim()
  name: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(320, { message: '$property deve ter no máximo 320 caracteres' })
  @Trim()
  email?: string;

  @ApiPropertyOptional({ example: '11' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(2, { message: '$property deve ter no máximo 2 caracteres' })
  @Trim()
  areaCode?: string;

  @ApiPropertyOptional({ example: '999999999' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(9, { message: '$property deve ter no máximo 9 caracteres' })
  @Trim()
  phone?: string;

  @ApiPropertyOptional({ example: 'Rua das Flores' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(100, { message: '$property deve ter no máximo 100 caracteres' })
  @Trim()
  street?: string;

  @ApiPropertyOptional({ example: '100' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(10, { message: '$property deve ter no máximo 10 caracteres' })
  @Trim()
  number?: string;

  @ApiPropertyOptional({ example: 'Apto 12' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(30, { message: '$property deve ter no máximo 30 caracteres' })
  @Trim()
  complement?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(60, { message: '$property deve ter no máximo 60 caracteres' })
  @Trim()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(60, { message: '$property deve ter no máximo 60 caracteres' })
  @Trim()
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(2, { message: '$property deve ter no máximo 2 caracteres' })
  @Trim()
  state?: string;

  @ApiPropertyOptional({ example: '01001000' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(8, { message: '$property deve ter no máximo 8 caracteres' })
  @Trim()
  zipCode?: string;
}

export class IssueBankPaymentInputDto {
  @ApiProperty({ example: 1, description: 'Banco cujas credenciais Inter serão usadas' })
  @StringToNumber()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser positivo' })
  bankId: number;

  @ApiPropertyOptional({ example: 1, description: 'NFS-e de origem; usado só na trilha de tentativas' })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser positivo' })
  nfseId?: number;

  @ApiProperty({ enum: BankPaymentProvider, example: BankPaymentProvider.INTER })
  @IsEnum(BankPaymentProvider, { message: '$property deve ser um provedor válido' })
  provider: BankPaymentProvider;

  @ApiProperty({ example: 'INV-2026-001' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(15, { message: '$property deve ter no máximo 15 caracteres' })
  @Trim()
  yourNumber: string;

  @ApiProperty({ example: 150.5 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '$property deve ser um número com até 2 casas decimais' })
  @IsPositive({ message: '$property deve ser positivo' })
  amount: number;

  @ApiProperty({ example: '2026-09-01', description: 'Data de vencimento no formato YYYY-MM-DD' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '$property deve estar no formato YYYY-MM-DD' })
  @Trim()
  dueDate: string;

  @ApiProperty({ example: 30, description: 'Dias após o vencimento em que a cobrança permanece válida' })
  @IsNumber({}, { message: '$property deve ser um número' })
  @Min(0, { message: '$property deve ser maior ou igual a 0' })
  daysAfterDue: number;

  @ApiProperty({ type: IssueBankPaymentPayerInputDto })
  @ValidateNested()
  @Type(() => IssueBankPaymentPayerInputDto)
  payer: IssueBankPaymentPayerInputDto;

  @ApiPropertyOptional({ example: 2, description: 'Percentual de multa após o vencimento (ex.: 2 = 2%)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '$property deve ser um número com até 2 casas decimais' })
  @Min(0, { message: '$property deve ser maior ou igual a 0' })
  @Max(100, { message: '$property deve ser menor ou igual a 100' })
  fineRate?: number | null;

  @ApiPropertyOptional({ example: 1, description: 'Percentual de mora ao mês (ex.: 1 = 1% a.m.)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '$property deve ser um número com até 2 casas decimais' })
  @Min(0, { message: '$property deve ser maior ou igual a 0' })
  @Max(100, { message: '$property deve ser menor ou igual a 100' })
  moraRate?: number | null;
}

export class IssueBankPaymentOutputDto implements GatewayIssueOutput {
  @ApiProperty({ enum: BankPaymentProvider, example: BankPaymentProvider.INTER })
  provider: BankPaymentProvider;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  requestCode: string;
}
