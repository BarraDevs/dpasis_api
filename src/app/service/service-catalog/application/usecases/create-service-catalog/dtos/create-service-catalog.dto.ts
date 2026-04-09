import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsNotEmpty, IsPositive, IsString, MaxLength, Min } from 'class-validator';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateServiceCatalogInputDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a 1' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  cnaeNbsIndopId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a 1' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  billedId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a 1' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  categoryId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a 1' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  deliveryTermId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a 1' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  freightId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a 1' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  proposalValidityId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a 1' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  warrantyId: number;

  @ApiProperty({ example: [1], description: 'IDs das empresas associadas ao serviço (obrigatório pelo menos 1)' })
  @IsArray({ message: '$property deve ser um array' })
  @ArrayMinSize(1, { message: '$property deve ter pelo menos 1 empresa' })
  @IsInt({ each: true, message: 'Cada ID deve ser um número inteiro' })
  @IsPositive({ each: true, message: 'Cada ID deve ser um número positivo' })
  companyIds: number[];

  @ApiProperty({ example: 'Instalação de sistema' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(500, { message: '$property deve ter no máximo 500 caracteres' })
  @Trim()
  name: string;

  @ApiProperty({ example: 150000 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a 0' })
  unitPriceInCents: number;

  @ApiProperty({ example: 'Descrição do serviço ofertado.' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(8192, { message: '$property deve ter no máximo 8192 caracteres' })
  @Trim()
  description: string;

  @ApiProperty({ example: true })
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  isCommercial: boolean;
}

export class CreateServiceCatalogOutputDto {
  id: number;
}
