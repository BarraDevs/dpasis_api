import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProductInputDto } from '../../create-product/dtos/create-product.dto';

export class EditProductInputDto extends PartialType(
  OmitType(CreateProductInputDto, ['companyId']),
  { skipNullProperties: false }
) {}
