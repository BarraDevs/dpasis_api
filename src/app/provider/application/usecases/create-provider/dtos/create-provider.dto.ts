import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDate, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';

export class CreateProviderInputDto {
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  name: string;

  @IsEnum(ProviderType, { message: '$property deve ser um dos valores: ' + Object.values(ProviderType).join(', ') })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  type: ProviderType;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a $constraint1' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  valueInCents: number;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  cnpj: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  ie: string;

  @ValidateIf((o) => o.type === ProviderType.RECURRING)
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a $constraint1' })
  @Max(31, { message: '$property deve ser menor ou igual a $constraint1' })
  @IsNotEmpty({ message: '$property é obrigatório quando type é RECURRING' })
  paymentDay: number | null;

  @ValidateIf((o) => o.type === ProviderType.ONE_TIME)
  @IsDate({ message: '$property deve ser uma data válida' })
  @Type(() => Date)
  @IsNotEmpty({ message: '$property é obrigatório quando type é ONE_TIME' })
  paymentExpirationDate: Date | null;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  companyName: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  zipCode: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  street: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  number: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  complement: string | null;

  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  reference: string | null;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  neighborhood: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  city: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  state: string;

  @IsEmail({}, { message: '$property deve ser um email válido' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  email: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  website: string | null;

  @Trim()
  @IsString({ message: '$property deve ser uma string', each: true })
  @IsArray({ message: '$property deve ser um array' })
  @ArrayMinSize(1, { message: '$property deve ter ao menos $constraint1 item' })
  companyIds: string[];
}

export class CreateProviderOutputDto {
  id: string;
}
