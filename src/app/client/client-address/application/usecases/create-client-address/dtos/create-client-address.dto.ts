import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateClientAddressInputDto {
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @Trim()
  clientId: number;

  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsEnum(ClientAddressType, { message: '$property deve ser um tipo de endereço válido' })
  type: ClientAddressType;

  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  zipCode: string;

  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  street: string;

  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  number: string;

  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  complement: string | null;

  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  neighborhood: string;

  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  city: string;

  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  state: string;
}

export class CreateClientAddressOutputDto {
  id: number;
}
