import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateClientTypeInputDto } from '../../create-client-type/dtos/create-client-type.dto';

export class EditClientTypeInputDto extends PartialType(
  OmitType(CreateClientTypeInputDto, ['clientId'] as const),
  {
    skipNullProperties: true,
  },
) {}
