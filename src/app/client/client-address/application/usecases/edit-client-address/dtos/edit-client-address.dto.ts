import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateClientAddressInputDto } from '../../create-client-address/dtos/create-client-address.dto';

export class EditClientAddressInputDto extends PartialType(
  OmitType(CreateClientAddressInputDto, ['clientId'] as const),
  {
    skipNullProperties: false,
  }
) {}
