import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateServiceInputDto } from '../../create-service/dtos/create-service.dto';

export class EditServiceInputDto extends PartialType(
  OmitType(CreateServiceInputDto, ['companyId']),
  { skipNullProperties: false }
) {}
