import { PartialType } from '@nestjs/swagger';
import { CreateItemInputDto } from '../../create-item/dtos/create-item.dto';

export class EditItemInputDto extends PartialType(CreateItemInputDto) {}
