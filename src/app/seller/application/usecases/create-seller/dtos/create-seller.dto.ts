import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateSellerInputDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  name: string;

  @ApiProperty({ example: '1133334444' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  phone: string;

  @ApiPropertyOptional({ example: 'João' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  nickname?: string | null;

  @ApiProperty({ example: '11999998888' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  whatsapp: string;

  @ApiProperty({ example: 'joao@vendedor.com' })
  @IsEmail({}, { message: '$property deve ser um e-mail válido' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  email: string;

  @ApiProperty({ example: 10.5 })
  @IsNumber({}, { message: '$property deve ser um número' })
  @Min(0, { message: '$property deve ser no mínimo 0' })
  @Max(100, { message: '$property deve ser no máximo 100' })
  @StringToNumber()
  @Transform(({ value }) => value === '' ? null : Number(value))
  commission: number;

  @ApiPropertyOptional({ example: 'Observações sobre o vendedor' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  observation?: string | null;

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
  complement?: string | null;

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

export class CreateSellerOutputDto {
  id: number;
}
