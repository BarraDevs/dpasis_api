import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateResaleInputDto } from '../../create-resale/dtos/create-resale.dto';

export class EditResaleInputDto extends PartialType(
  OmitType(CreateResaleInputDto, ['id', 'createdAt'] as const),
  { skipNullProperties: false },
) {}
