import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateClientAddressInputDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @Trim()
  clientId: number;

  @ApiProperty({ example: Object.values(ClientAddressType).join(', ') })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsEnum(ClientAddressType, { message: '$property inválido.' })
  type: ClientAddressType;

  @ApiProperty({ example: '12345-678' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  zipCode: string;

  @ApiProperty({ example: 'Rua das Laranjeiras' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  street: string;

  @ApiProperty({ example: '100A' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  number: string;

  @ApiPropertyOptional({ example: 'Apto 202' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  complement: string | null;

  @ApiProperty({ example: 'Centro' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  neighborhood: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  city: string;

  @ApiPropertyOptional({ example: '3550308' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  @MaxLength(7, { message: '$property deve ter no máximo 7 caracteres' })
  cityCodeIbge: string | null;

  @ApiProperty({ example: 'SP' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  state: string;
}

export class CreateClientAddressOutputDto {
  id: number;
}
