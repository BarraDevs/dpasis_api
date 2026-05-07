import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { IsUnsigned32HexString } from 'src/infra/validators/class/decorators/unsigned-32-hex-string/is-unsigned-32-hex-string';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateResaleInputDto {
  @ApiPropertyOptional({
    example: '43',
    description:
      'ID opcional para alinhar com sistema externo ou legado (hexadecimal, 1 a 8 caracteres); se omitido, o banco gera automaticamente.',
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null && v !== '')
  @IsString({ message: '$property deve ser uma string' })
  @IsUnsigned32HexString()
  id?: string;

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

  @ApiPropertyOptional({ example: 'Revenda Centro' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  nickname?: string | null;

  @ApiPropertyOptional({ example: '2026-04-01T03:00:00.000Z' })
  @IsOptional()
  @ValidateIf((o) => o.validityDate != null && o.validityDate !== '')
  @IsDateString({}, { message: '$property deve ser uma data válida no formato ISO 8601' })
  validityDate?: string | null;

  @ApiPropertyOptional({ example: 'acesso@revenda.com' })
  @IsOptional()
  @ValidateIf((o) => o.accessEmail != null && o.accessEmail !== '')
  @IsEmail({}, { message: '$property deve ser um e-mail válido' })
  @IsString()
  @Trim()
  accessEmail?: string | null;

  @ApiPropertyOptional({ example: '****' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  @MaxLength(8192, { message: '$property deve ter no máximo 8192 caracteres' })
  accessPassword?: string | null;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @ValidateIf((_o, v) => v != null && v !== '')
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  paymentDay?: number | null;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @ValidateIf((_o, v) => v != null && v !== '')
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  bonus?: number | null;

  @ApiPropertyOptional({ example: 10, description: 'Dia do mês (1–31) para início da cobrança.' })
  @IsOptional()
  @ValidateIf((_o, v) => v != null && v !== '')
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser no mínimo 1' })
  @Max(31, { message: '$property deve ser no máximo 31' })
  @StringToNumber()
  billingStartDay?: number | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  receivesSupportEmail?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  servedByRoot?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  manufacturerResale?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  indicatorResale?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  recurringResale?: boolean;
}

export type CreateResaleExecuteInputDto = Omit<CreateResaleInputDto, 'id'> & { id?: number };

export class CreateResaleOutputDto {
  id: number;
}
