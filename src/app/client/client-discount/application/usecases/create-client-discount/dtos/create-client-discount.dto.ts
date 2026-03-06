import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DiscountType } from 'src/app/client/client-discount/domain/enums/discount-type.enum';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateClientDiscountInputDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior que 0' })
  clientId: number;

  @ApiProperty({ example: 'Desconto de teste' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(1000, { message: '$property deve ter no máximo 1000 caracteres' })
  @Trim()
  description: string;

  @ApiProperty({ example: Object.values(DiscountType).join(', ') })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsEnum(DiscountType, { message: '$property deve ser percentage ou monetary' })
  type: DiscountType;

  @ApiProperty({ example: 'Percentage: 0-10000 (10.50% = 1050). Monetary: cents.' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a 0' })
  discountValue: number;

  @ApiProperty({ example: 1, minimum: 1, maximum: 12 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser entre 1 e 12' })
  @Max(12, { message: '$property deve ser entre 1 e 12' })
  month: number;

  @ApiProperty({ example: 2026, minimum: 2020 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(2020, { message: '$property deve ser maior ou igual a 2020' })
  year: number;

  @ApiProperty({ example: true })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsBoolean({ message: '$property deve ser um booleano' })
  doNotGenerateCharge: boolean;

  @ApiProperty({ example: true })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsBoolean({ message: '$property deve ser um booleano' })
  terminateContract: boolean;
}

export class CreateClientDiscountOutputDto {
  id: number;
}
