import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateBudgetItemInputDto {
  @IsEnum(BudgetItemType, { message: '$property deve ser "Produto" ou "Serviço"' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  itemType: BudgetItemType;

  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  @IsOptional()
  productId?: string | null;

  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  @IsOptional()
  serviceId?: string | null;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(512, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  description: string;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  quantity: number;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  unitPriceInCents: number;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  discountInCents: number;
}

export class CreateBudgetInputDto {
  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  companyId: string;

  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  clientId: string;

  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  sellerId: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  freightType: string;

  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  @IsOptional()
  @Trim()
  shipperId?: string | null;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  freightValueInCents: number;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  discountInCents: number;

  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  commercialProcess?: string | null;

  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  commercialNote?: string | null;

  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  observations?: string | null;

  @ValidateNested({ each: true })
  @Type(() => CreateBudgetItemInputDto)
  @IsArray({ message: '$property deve ser um array' })
  @ArrayMinSize(1, { message: '$property deve ter ao menos $constraint1 item' })
  items: CreateBudgetItemInputDto[];
}

export class CreateBudgetOutputDto {
  id: string;
}
