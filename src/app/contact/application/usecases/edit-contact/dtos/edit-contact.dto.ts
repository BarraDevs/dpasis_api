import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateContactInputDto } from '../../create-contact/dtos/create-contact.dto';

export class EditContactInputDto extends PartialType(OmitType(CreateContactInputDto, ['ownerId'])) {}
