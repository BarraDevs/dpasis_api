import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllClientAddressQueryDto extends Queries {
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @Trim()
  clientId: number;

  @IsOptional()
  @IsEnum(ClientAddressType, { message: '$property inválido.' })
  type?: ClientAddressType;
}
