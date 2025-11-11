import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';

export class CreateCompanyInputDto {
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  name: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  fantasyName: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  document: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  ie: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  phone01: string;

  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  phone02: string | null;

  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  cellphone: string | null;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  email01: string;

  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  email02: string | null;

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

  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  complement: string | null;

  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
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
}

export class CreateCompanyOutputDto {
  id: string;
}
