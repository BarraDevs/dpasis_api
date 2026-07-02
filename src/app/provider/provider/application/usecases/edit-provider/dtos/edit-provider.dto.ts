import { PartialType } from '@nestjs/swagger';
import { CreateProviderInputDto } from '../../create-provider/dtos/create-provider.dto';

export class EditProviderInputDto extends PartialType(CreateProviderInputDto) {}
