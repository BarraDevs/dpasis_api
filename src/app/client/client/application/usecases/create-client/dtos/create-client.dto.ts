import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { CreateClientAddressInputDto } from 'src/app/client/client-address/application/usecases/create-client-address/dtos/create-client-address.dto';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateClientInputDto {
  @ApiPropertyOptional({
    example: 67,
    description: 'ID opcional para alinhar com sistema externo ou legado; se omitido, o banco gera automaticamente.',
  })
  @IsOptional()
  @IsNumber({}, { message: '$property deve ser um número' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  id?: number;

  @ApiProperty({ example: Object.values(ClientType).join(', ') })
  @IsEnum(ClientType, { message: '$property inválido.' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  type: ClientType;

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

  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: '$property deve ser um número' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  groupId: number;

  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: '$property deve ser um número' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  ownerId: number;

  @ApiProperty({ example: [1], description: 'IDs das empresas associadas ao cliente (obrigatório pelo menos 1)' })
  @IsArray({ message: '$property deve ser um array' })
  @ArrayMinSize(1, { message: '$property deve ter pelo menos 1 empresa' })
  @IsInt({ each: true, message: 'Cada ID deve ser um número inteiro' })
  @IsPositive({ each: true, message: 'Cada ID deve ser um número positivo' })
  companyIds: number[];

  @ApiProperty({ example: 'Empresa LTDA' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  companyName: string;

  @ApiPropertyOptional({ example: 'Empresa' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  fantasyName: string | null;

  @ApiProperty({ example: 'São Paulo' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  headquarters: string;

  @ApiProperty({ example: Object.values(ClientInvoiceType).join(', ') })
  @IsEnum(ClientInvoiceType, { message: '$property inválido.' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  invoiceType: ClientInvoiceType;

  @ApiProperty({ example: true })
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  generateInvoice: boolean;

  @ApiProperty({ type: OmitType(CreateClientAddressInputDto, ['clientId', 'type']) })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @ValidateNested({ message: '$property deve ser um objeto válido' })
  @Type(() => OmitType(CreateClientAddressInputDto, ['clientId', 'type']))
  address: Omit<CreateClientAddressInputDto, 'clientId' | 'type'>;
}

export class CreateClientOutputDto {
  id: number;
}
