import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateClientAttachmentInputDto } from '../../create-client-attachment/dtos/create-client-attachment.dto';

export class EditClientAttachmentInputDto extends PartialType(
  OmitType(CreateClientAttachmentInputDto, ['clientId']),
  {
    skipNullProperties: false,
  }
) {}
