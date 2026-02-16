import { PartialType } from '@nestjs/swagger';
import { CreateFaqInputDto } from '../../create-faq/dtos/create-faq.dto';

export class EditFaqInputDto extends PartialType(CreateFaqInputDto) {}
