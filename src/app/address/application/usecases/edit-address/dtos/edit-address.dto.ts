import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAddressInputDto } from '../../create-address/dtos/create-address.dto';

export class EditAddressInputDto extends PartialType(OmitType(CreateAddressInputDto, ['ownerId'])) {}
