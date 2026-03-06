import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { BillingMonths } from 'src/shared/value-objects/billing-months/billing-months.vo';
import { DueDateDay } from 'src/shared/value-objects/due-date-day/due-date-day.vo';
import { EmissionDay } from 'src/shared/value-objects/emission-day/emission-day.vo';

export class CreateClientInvoiceConfigInputDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @IsInt()
  clientId: number;

  @ApiProperty({ example: true })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsBoolean()
  generateNf: boolean;

  @ApiProperty({ example: Object.values(ClientInvoiceConfigType).join(', ') })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsEnum(ClientInvoiceConfigType, { message: '$property inválido.' })
  type: ClientInvoiceConfigType;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @IsInt()
  @Min(EmissionDay.MIN_DAY, { message: '$property deve ser entre 1 e 31' })
  @Max(EmissionDay.MAX_DAY, { message: '$property deve ser entre 1 e 31' })
  emissionDay: number;

  @ApiProperty({ example: Object.values(ClientInvoiceConfigDueDateType).join(', ') })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsEnum(ClientInvoiceConfigDueDateType, { message: '$property inválido.' })
  dueDateType: ClientInvoiceConfigDueDateType;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @StringToNumber()
  @IsInt()
  @Min(DueDateDay.MIN_DAY, { message: '$property deve ser entre 1 e 31' })
  @Max(DueDateDay.MAX_DAY, { message: '$property deve ser entre 1 e 31' })
  dueDateDay?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @StringToNumber()
  @IsInt()
  @Min(1, { message: '$property deve ser positivo' })
  deadlineDays?: number;

  @ApiPropertyOptional({ example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(BillingMonths.MIN_MONTH, { each: true, message: 'Cada mês deve ser entre 1 e 12' })
  @Max(BillingMonths.MAX_MONTH, { each: true, message: 'Cada mês deve ser entre 1 e 12' })
  months?: number[];

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @IsInt()
  billingAddressId: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @IsInt()
  bankId: number;

  @ApiProperty({ example: true })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsBoolean()
  autoProtestBoleto: boolean;

  @ApiPropertyOptional({ example: 'Mensagem de cobrança' })
  @IsOptional()
  @IsString()
  @Trim()
  message?: string | null;
}

export class CreateClientInvoiceConfigOutputDto {
  id: number;
}
