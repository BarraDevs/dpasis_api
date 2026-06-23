import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateProviderInputDto {
  @ApiProperty({ example: 'Prestador LTDA' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  name: string;

  @ApiProperty({ example: ProviderType.ONE_OFF, enum: ProviderType })
  @IsEnum(ProviderType, { message: '$property inválido.' })
  type: ProviderType;

  @ApiProperty({ example: 150000 })
  @StringToNumber()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a zero' })
  valueInCents: number;

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

  @ApiPropertyOptional({
    example: 15,
    description: 'Dia do mês (1–31). Obrigatório quando type = RECURRING.',
  })
  @ValidateIf((o: CreateProviderInputDto) => o.type === ProviderType.RECURRING)
  @IsNotEmpty({ message: '$property é obrigatório quando type é RECURRING' })
  @StringToNumber()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser entre 1 e 31' })
  @Max(31, { message: '$property deve ser entre 1 e 31' })
  paymentDate?: number;

  @ApiPropertyOptional({
    example: 30,
    description: 'Quantidade de dias (> 0). Obrigatório quando type = ONE_OFF.',
  })
  @ValidateIf((o: CreateProviderInputDto) => o.type === ProviderType.ONE_OFF)
  @IsNotEmpty({ message: '$property é obrigatório quando type é ONE_OFF' })
  @StringToNumber()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  deadline?: number;

  @ApiProperty({ example: 'Prestador' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  fantasyName: string;

  @ApiProperty({ example: 'contato@prestador.com' })
  @IsEmail({}, { message: '$property deve ser um e-mail válido' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  email: string;

  @ApiProperty({ example: 'https://prestador.com' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  website: string;

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
}

export class CreateProviderOutputDto {
  id: number;
}
