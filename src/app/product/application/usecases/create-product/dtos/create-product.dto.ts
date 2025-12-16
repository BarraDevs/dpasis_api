import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateProductInputDto {
  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  companyId: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  type: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  group01: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  group02: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  description: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  complement: string | null;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  manufacturerCode: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  brand: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  measureUnit: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  ncm: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  economicBatch: string;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  minimumStock: number;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  maximumStock: number;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  warrantyDays: number;

  @IsNumber({}, { message: '$property deve ser um número' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  weightInKg: number;

  @IsNumber({}, { message: '$property deve ser um número' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  heightInCm: number;

  @IsNumber({}, { message: '$property deve ser um número' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  lengthInCm: number;

  @IsNumber({}, { message: '$property deve ser um número' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  widthInCm: number;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  markup: number;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  marginB: number;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(10, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  currency: string;

  @IsNumber({}, { message: '$property deve ser um número' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  exchangeRate: number;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  unitCostInCents: number;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  unitPriceInCents: number;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  ean: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  additionalInfo: string | null;

  @IsArray({ message: '$property deve ser um array' })
  @IsUUID('4', { each: true, message: '$property deve conter UUIDs válidos' })
  supplierIds: string[];

  @IsArray({ message: '$property deve ser um array' })
  @IsString({ each: true, message: '$property deve conter apenas strings' })
  images: string[];
}

export class CreateProductOutputDto {
  id: string;
}
