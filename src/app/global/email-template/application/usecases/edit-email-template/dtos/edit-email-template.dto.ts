import { PartialType } from '@nestjs/swagger';
import { CreateEmailTemplateInputDto } from '../../create-email-template/dtos/create-email-template.dto';

export class EditEmailTemplateInputDto extends PartialType(CreateEmailTemplateInputDto) {}
