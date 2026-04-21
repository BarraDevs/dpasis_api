import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateIf } from 'class-validator';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateResaleInputDto {
  @ApiPropertyOptional({
    example: 67,
    description: 'ID opcional para alinhar com sistema externo ou legado; se omitido, o banco gera automaticamente.',
  })
  @IsOptional()
  @IsNumber({}, { message: '$property deve ser um número' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  id?: number;

  @ApiProperty({ example: 'REV-001' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  code: string;

  @ApiProperty({ example: 'Revenda Exemplo' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  name: string;

  @ApiPropertyOptional({ example: 'ID-EXTERNO' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  identifier: string | null;

  @ApiProperty({ example: '01310-100' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  zipCode: string;

  @ApiProperty({ example: 'Av Paulista' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  street: string;

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

  @ApiProperty({ example: 'A1' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  licenseType: string;

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

  @ApiProperty({ example: '11999999999' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  phone01: string;

  @ApiPropertyOptional({ example: '11888888888' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  phone02: string | null;

  @ApiPropertyOptional({ example: 'CUPOM10' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  voucher: string | null;

  @ApiPropertyOptional({ example: 'contato@revenda.com' })
  @IsOptional()
  @ValidateIf((o) => o.email != null && o.email !== '')
  @IsEmail({}, { message: '$property deve ser um e-mail válido' })
  @IsString()
  @Trim()
  email: string | null;

  @ApiPropertyOptional({ example: 'https://revenda.com' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  website: string | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  receivesSupportEmail?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  servedByDpa?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  manufacturerReseller?: boolean;
}

export class CreateResaleOutputDto {
  id: number;
}
