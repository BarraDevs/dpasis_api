import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateClientInputDto } from '../../create-client/dtos/create-client.dto';

export class EditClientInputDto extends PartialType(
  OmitType(CreateClientInputDto, ['parentClientId'] as const),
  { skipNullProperties: false }
) {}
