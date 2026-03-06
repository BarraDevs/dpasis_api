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
import { EmissionDay } from 'src/shared/value-objects/emission-day/emission-day.vo';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateClientInvoiceConfigInputDto {
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @IsInt()
  clientId: number;

  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsBoolean()
  generateNf: boolean;

  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsEnum(ClientInvoiceConfigType, { message: '$property deve ser MONTHLY ou ANNUAL' })
  type: ClientInvoiceConfigType;

  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @IsInt()
  @Min(EmissionDay.MIN_DAY, { message: '$property deve ser entre 1 e 31' })
  @Max(EmissionDay.MAX_DAY, { message: '$property deve ser entre 1 e 31' })
  emissionDay: number;

  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsEnum(ClientInvoiceConfigDueDateType, {
    message: '$property deve ser DUE_DATE ou DEADLINE',
  })
  dueDateType: ClientInvoiceConfigDueDateType;

  @IsOptional()
  @StringToNumber()
  @IsInt()
  @Min(EmissionDay.MIN_DAY, { message: '$property deve ser entre 1 e 31' })
  @Max(EmissionDay.MAX_DAY, { message: '$property deve ser entre 1 e 31' })
  dueDateDay?: number;

  @IsOptional()
  @StringToNumber()
  @IsInt()
  @Min(1, { message: '$property deve ser positivo' })
  deadlineDays?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true, message: 'Cada mês deve ser entre 1 e 12' })
  @Max(12, { each: true, message: 'Cada mês deve ser entre 1 e 12' })
  months?: number[];

  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @IsInt()
  billingAddressId: number;

  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @IsInt()
  bankId: number;

  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsBoolean()
  autoProtestBoleto: boolean;

  @IsOptional()
  @IsString()
  @Trim()
  message?: string | null;
}

export class CreateClientInvoiceConfigOutputDto {
  id: number;
}
