import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateResaleContactInputDto } from '../../create-resale-contact/dtos/create-resale-contact.dto';

export class EditResaleContactInputDto extends PartialType(
  OmitType(CreateResaleContactInputDto, ['resaleId'] as const),
  {
    skipNullProperties: false,
  }
) {}
