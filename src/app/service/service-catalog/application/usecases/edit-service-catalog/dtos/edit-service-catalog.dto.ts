import { PartialType } from '@nestjs/swagger';
import { CreateServiceCatalogInputDto } from '../../create-service-catalog/dtos/create-service-catalog.dto';

export class EditServiceCatalogInputDto extends PartialType(CreateServiceCatalogInputDto) {}
