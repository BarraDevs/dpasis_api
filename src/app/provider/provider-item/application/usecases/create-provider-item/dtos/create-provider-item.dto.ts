import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ProviderItemScheduleType } from 'src/app/provider/provider-item/domain/enums/provider-item-schedule-type.enum';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateProviderItemInputDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  @Trim()
  providerId: number;

  @ApiProperty({ example: 'Serviço de manutenção' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  description: string;

  @ApiProperty({ example: 100000, description: 'Valor total em centavos' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior que zero' })
  @StringToNumber()
  totalValueInCents: number;

  @ApiProperty({ example: 3 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior que zero' })
  @StringToNumber()
  installmentsCount: number;

  @ApiProperty({ example: Object.values(ProviderItemScheduleType).join(', ') })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsEnum(ProviderItemScheduleType, { message: '$property inválido.' })
  scheduleType: ProviderItemScheduleType;

  @ApiPropertyOptional({ example: 30 })
  @ValidateIf((o: CreateProviderItemInputDto) => o.scheduleType === ProviderItemScheduleType.INTERVAL_DAYS)
  @IsNotEmpty({ message: '$property é obrigatório quando o tipo de vencimento é Em dias' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior que zero' })
  @StringToNumber()
  intervalDays?: number | null;

  @ApiPropertyOptional({ example: 10 })
  @ValidateIf((o: CreateProviderItemInputDto) => o.scheduleType === ProviderItemScheduleType.DUE_DAY)
  @IsNotEmpty({ message: '$property é obrigatório quando o tipo de vencimento é Dia de vencimento' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser entre 1 e 31' })
  @Max(31, { message: '$property deve ser entre 1 e 31' })
  @StringToNumber()
  dueDay?: number | null;

  @ApiProperty({ example: '2026-07-10' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsDateString({}, { message: '$property deve ser uma data válida no formato ISO 8601' })
  firstDueDate: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  bankId: number;
}

export class CreateProviderItemOutputDto {
  @ApiProperty()
  id: number;
}
