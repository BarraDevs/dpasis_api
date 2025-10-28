import { OmitType } from '@nestjs/swagger';
import { CreateContactInputDto } from '../../create-contact/dtos/create-contact.dto';

export class EditContactInputDto extends OmitType(CreateContactInputDto, ['ownerId']) {}
