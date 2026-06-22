import { PartialType } from '@nestjs/swagger';
import { CreateCarrierInputDto } from '../../create-carrier/dtos/create-carrier.dto';

export class EditCarrierInputDto extends PartialType(CreateCarrierInputDto) {}
