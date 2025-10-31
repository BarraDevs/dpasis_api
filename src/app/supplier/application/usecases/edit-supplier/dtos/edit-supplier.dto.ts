import { PartialType } from '@nestjs/swagger';
import { CreateSupplierInputDto } from '../../create-supplier/dtos/create-supplier.dto';

export class EditSupplierInputDto extends PartialType(CreateSupplierInputDto, {
  skipNullProperties: false,
}) {}
