import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';

export class CreateAddressInputDto {
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  nickname?: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  zipCode: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  street: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  number: string;

  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  complement?: string;

  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  reference?: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  neighborhood: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  city: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  state: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  ownerId: string;
}

export class CreateAddressOutputDto {
  id: string;
}
