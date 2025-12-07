import { ApiHideProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllAddressQueryDto extends Queries {
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  ownerId: string;

  // it'll be used internally in the controllers to differentiate main and secondary addresses
  @ApiHideProperty()
  isMain: boolean;
}
