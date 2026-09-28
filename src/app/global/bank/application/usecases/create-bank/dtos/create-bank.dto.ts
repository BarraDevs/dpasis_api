import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateBankInputDto {
  @ApiProperty({ example: 'Empresa XYZ Ltda' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  drawer: string;

  @ApiProperty({ example: '123' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(50, { message: '$property deve ter no máximo 50 caracteres' })
  @Trim()
  wallet: string;

  @ApiProperty({ example: '12345-6' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(50, { message: '$property deve ter no máximo 50 caracteres' })
  @Trim()
  account: string;

  @ApiProperty({ example: '0001' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(50, { message: '$property deve ter no máximo 50 caracteres' })
  @Trim()
  agency: string;

  @ApiProperty({ example: '001' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(20, { message: '$property deve ter no máximo 20 caracteres' })
  @Trim()
  bankCode: string;

  @ApiProperty({ example: 'Banco do Brasil' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  bankName: string;

  @ApiPropertyOptional({ example: 'Local de pagamento' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  paymentLocation: string | null;

  @ApiPropertyOptional({ example: 2, description: 'Percentual de multa após o vencimento (ex.: 2 = 2%)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '$property deve ser um número com até 2 casas decimais' })
  @Min(0, { message: '$property deve ser maior ou igual a 0' })
  @Max(100, { message: '$property deve ser menor ou igual a 100' })
  fineRate?: number | null;

  @ApiPropertyOptional({ example: 1, description: 'Percentual de mora ao mês (ex.: 1 = 1% a.m.)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '$property deve ser um número com até 2 casas decimais' })
  @Min(0, { message: '$property deve ser maior ou igual a 0' })
  @Max(100, { message: '$property deve ser menor ou igual a 100' })
  moraRate?: number | null;

  @ApiPropertyOptional({ example: 'https://cdpj.partners.bancointer.com.br' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(512, { message: '$property deve ter no máximo 512 caracteres' })
  @Trim()
  apiUrl?: string | null;

  @ApiPropertyOptional({ example: 'inter-client-id' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  clientId?: string;

  @ApiPropertyOptional({ example: 'inter-client-secret' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(512, { message: '$property deve ter no máximo 512 caracteres' })
  @Trim()
  clientSecret?: string;

  @ApiPropertyOptional({
    example: 'token-do-webhook-min-16',
    description: 'Segredo no path do webhook Inter. Se omitido ao gravar clientId e clientSecret, a API gera um.',
  })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MinLength(16, { message: '$property deve ter no mínimo 16 caracteres' })
  @MaxLength(128, { message: '$property deve ter no máximo 128 caracteres' })
  @Trim()
  webhookToken?: string;
}

export class CreateBankOutputDto {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional({
    description: 'Token do webhook, devolvido somente nesta resposta. Não é lido de novo.',
  })
  webhookToken?: string;
}
