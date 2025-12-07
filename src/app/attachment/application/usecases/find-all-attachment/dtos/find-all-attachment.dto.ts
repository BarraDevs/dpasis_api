import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllAttachmentQueryDto extends Queries {
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  ownerId: string;
}
