import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateServiceCategoryInputDto {
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  name: string;
}

export class CreateServiceCategoryOutputDto {
  id: string;
}
