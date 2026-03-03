import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateClientItemInputDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  @Trim()
  clientId: number;

  @ApiProperty({ example: 'Descrição do item' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a zero' })
  @StringToNumber()
  quantity: number;

  @ApiProperty({ example: 10000, description: 'Valor em centavos' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a zero' })
  @StringToNumber()
  unitValueInCents: number;

  @ApiProperty({ example: '1234567' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(50, { message: '$property deve ter no máximo 50 caracteres' })
  @Trim()
  cnae: string;

  @ApiProperty({ example: '12345678' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(50, { message: '$property deve ter no máximo 50 caracteres' })
  @Trim()
  nbs: string;

  @ApiProperty({ example: '1' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(50, { message: '$property deve ter no máximo 50 caracteres' })
  @Trim()
  indop: string;
}

export class CreateClientItemOutputDto {
  id: number;
}
