import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateClientContactInputDto } from '../../create-client-contact/dtos/create-client-contact.dto';

export class EditClientContactInputDto extends PartialType(
  OmitType(CreateClientContactInputDto, ['clientId'] as const),
  {
    skipNullProperties: false,
  }
) {}
