import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProviderItemInputDto } from '../../create-provider-item/dtos/create-provider-item.dto';

export class EditProviderItemInputDto extends PartialType(
  OmitType(CreateProviderItemInputDto, ['providerId'] as const),
) {}
