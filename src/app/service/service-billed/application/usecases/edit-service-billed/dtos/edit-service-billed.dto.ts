import { PartialType } from '@nestjs/swagger';
import { CreateServiceBilledInputDto } from '../../create-service-billed/dtos/create-service-billed.dto';

export class EditServiceBilledInputDto extends PartialType(CreateServiceBilledInputDto) {}
