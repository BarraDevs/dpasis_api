import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ClientInvoiceType } from 'src/app/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/domain/enums/client-type.enum';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateClientInputDto {
  @IsEnum(ClientType, { message: '$property deve ser um tipo de cliente válido' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  type: ClientType;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  document: string;

  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  ie: string | null;

  @IsNumber({}, { message: '$property deve ser um número' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  groupId: number;

  @IsNumber({}, { message: '$property deve ser um número' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  ownerId: number;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  companyName: string;

  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  fantasyName: string | null;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  headquarters: string;

  @IsEnum(ClientInvoiceType, { message: '$property deve ser um tipo de fatura válido' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  invoiceType: ClientInvoiceType;

  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  generateInvoice: boolean;
}

export class CreateClientOutputDto {
  id: number;
}
