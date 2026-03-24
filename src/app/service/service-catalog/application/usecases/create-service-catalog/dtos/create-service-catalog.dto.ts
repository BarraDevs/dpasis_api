import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
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
  serviceBilledId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a 1' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  serviceCategoryId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a 1' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  serviceDeliveryTermId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a 1' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  serviceFreightId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a 1' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  serviceProposalValidityId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a 1' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  serviceWarrantyId: number;

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
