import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateLicenseInputDto } from '../../create-license/dtos/create-license.dto';

export class EditLicenseInputDto extends PartialType(
  OmitType(CreateLicenseInputDto, ['ownerId']),
  {
    skipNullProperties: false,
  }
) {}
