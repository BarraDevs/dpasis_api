import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateCompanyInputDto {
  @ApiProperty({ example: 'Empresa LTDA' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  name: string;

  @ApiProperty({ example: 'Empresa' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  fantasyName: string;

  @ApiProperty({ example: '09.748.165/0001-10' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  document: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  ie: string | null;

  @ApiProperty({ example: '01310100' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  zipCode: string;

  @ApiProperty({ example: 'Av Paulista' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  street: string;

  @ApiProperty({ example: '1000' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  number: string;

  @ApiPropertyOptional({ example: 'Sala 1' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  complement: string | null;

  @ApiProperty({ example: 'Bela Vista' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  neighborhood: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  city: string;

  @ApiProperty({ example: 'SP' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  state: string;

  @ApiProperty({ example: '1133334444' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  phone01: string;

  @ApiPropertyOptional({ example: '1144445555' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  phone02: string | null;

  @ApiPropertyOptional({ example: '11999998888' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  cellphone: string | null;

  @ApiProperty({ example: 'contato@empresa.com' })
  @IsEmail({}, { message: '$property deve ser um e-mail válido' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  email01: string;

  @ApiPropertyOptional({ example: 'vendas@empresa.com' })
  @IsOptional()
  @IsEmail({}, { message: '$property deve ser um e-mail válido' })
  @Trim()
  email02: string | null;
}

export class CreateCompanyOutputDto {
  id: number;
}
