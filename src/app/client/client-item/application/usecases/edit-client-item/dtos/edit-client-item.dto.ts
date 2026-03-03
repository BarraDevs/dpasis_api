import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateClientItemInputDto } from '../../create-client-item/dtos/create-client-item.dto';

export class EditClientItemInputDto extends PartialType(
  OmitType(CreateClientItemInputDto, ['clientId'] as const),
  {
    skipNullProperties: true,
  }
) {}
