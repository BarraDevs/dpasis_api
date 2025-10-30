import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAttachmentInputDto } from '../../create-attachment/dtos/create-attachment.dto';

export class EditAttachmentInputDto extends PartialType(
  OmitType(CreateAttachmentInputDto, ['ownerId']), // Omitindo ownerId da edição
  {
    skipNullProperties: false,
  },
) {}
