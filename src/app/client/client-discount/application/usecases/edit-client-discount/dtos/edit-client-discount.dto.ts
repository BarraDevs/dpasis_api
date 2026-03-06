import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateClientDiscountInputDto } from '../../create-client-discount/dtos/create-client-discount.dto';

export class EditClientDiscountInputDto extends PartialType(
  OmitType(CreateClientDiscountInputDto, ['clientId'] as const),
  { skipNullProperties: false },
) {}
