import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
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

  @ApiPropertyOptional({
    example: 10,
    description: 'ID do cliente pai. Quando informado, este cliente será um sub-cliente (dependente). Não pode ser alterado após o cadastro.',
  })
  @IsOptional()
  @IsNumber({}, { message: '$property deve ser um número' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  parentClientId: number | null;

  @ApiPropertyOptional({
    example: '2020-03-15',
    description:
      'Data de cadastro legada (yyyy-mm-dd, início do dia UTC). Opcional; se omitida, usa a data/hora atual. Não pode ser alterada após o cadastro.',
  })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: '$property deve estar no formato yyyy-mm-dd',
  })
  @IsDateString({}, { message: '$property deve ser uma data válida' })
  createdAt?: string;

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

  @ApiProperty({ example: 1, description: 'ID da revenda (Resale).' })
  @IsNumber({}, { message: '$property deve ser um número' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  resaleId: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID do pronome de tratamento (Honorific). Opcional.',
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: '$property deve ser um número' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  honorificId?: number | null;

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

  @ApiPropertyOptional({ example: 'Razão social constitucional', description: 'Nome social (opcional).' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  socialName: string | null;

  @ApiPropertyOptional({ example: 'cliente.example.com', description: 'Domínio associado ao cliente (opcional).' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  @MaxLength(128, { message: '$property deve ter no máximo 128 caracteres' })
  domain: string | null;

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
