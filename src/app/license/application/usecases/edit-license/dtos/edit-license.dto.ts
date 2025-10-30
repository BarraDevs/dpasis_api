import { PartialType } from '@nestjs/swagger';
import { CreateLicenseInputDto } from '../../create-license/dtos/create-license.dto';

export class EditLicenseInputDto extends PartialType(CreateLicenseInputDto, {
  skipNullProperties: false,
}) {}
