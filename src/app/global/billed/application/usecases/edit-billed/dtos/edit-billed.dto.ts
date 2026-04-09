import { PartialType } from '@nestjs/swagger';
import { CreateBilledInputDto } from '../../create-billed/dtos/create-billed.dto';

export class EditBilledInputDto extends PartialType(CreateBilledInputDto) {}
