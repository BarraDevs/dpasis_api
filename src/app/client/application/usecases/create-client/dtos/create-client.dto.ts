import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';

export class CreateClientInputDto {
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  kind: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  cnpj: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  ie: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  group: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  type: string;

  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsBoolean({ message: '$property deve ser booleano' })
  @Trim()
  generateInvoice: boolean;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  companyName: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  fantasyName: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  owner: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  headquarters: string;
}

export class CreateClientOutputDto {
  id: string;
}
