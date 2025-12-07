import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateSellerInputDto } from '../../create-seller/dtos/create-seller.dto';

export class EditSellerInputDto extends PartialType(
  OmitType(CreateSellerInputDto, ['password'] as const),
  {
    skipNullProperties: false,
  }
) {}
