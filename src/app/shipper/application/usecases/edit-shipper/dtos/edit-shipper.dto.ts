import { PartialType } from '@nestjs/swagger';
import { CreateShipperInputDto } from '../../create-shipper/dtos/create-shipper.dto';

export class EditShipperInputDto extends PartialType(CreateShipperInputDto, {
  skipNullProperties: false,
}) {}
