import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllLicenseQueryDto extends Queries {
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  ownerId: string;
}
