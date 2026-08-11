import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCompanyNfsConfigInputDto } from '../../create-company-nfs-config/dtos/create-company-nfs-config.dto';

export class EditCompanyNfsConfigInputDto extends PartialType(
  OmitType(CreateCompanyNfsConfigInputDto, ['companyId']),
) {}
