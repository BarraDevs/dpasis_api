import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateServiceInputDto {
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  name: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  nickname: string | null;

  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  companyId: string;

  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  categoryId: string;

  @IsArray({ message: '$property deve ser um array' })
  @ArrayMinSize(2, { message: '$property deve conter exatamente $constraint1 itens' })
  @ArrayMaxSize(2, { message: '$property deve conter exatamente $constraint1 itens' })
  @ArrayUnique({ message: '$property não deve conter itens duplicados' })
  @IsUUID('4', { each: true, message: '$property deve conter UUIDs válidos' })
  productIds: string[];

  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  deadline: string | null;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  @IsOptional()
  shippingValueInCents: number | null;

  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  warrant: string | null;

  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  weight: string | null;

  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  maxVolume: string | null;

  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  dimensions: string | null;

  @IsNumber({}, { message: '$property deve ser um número' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @Max(100, { message: '$property deve ser menor ou igual a $constraint1' })
  @StringToNumber()
  commission: number;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @StringToNumber()
  valueInCents: number;

  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  description: string | null;
}

export class CreateServiceOutputDto {
  id: string;
}
