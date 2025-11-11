import { PartialType } from '@nestjs/swagger';
import { CreateCompanyInputDto } from '../../create-company/dtos/create-company.dto';

export class EditCompanyInputDto extends PartialType(CreateCompanyInputDto, {
  skipNullProperties: false,
}) {}
