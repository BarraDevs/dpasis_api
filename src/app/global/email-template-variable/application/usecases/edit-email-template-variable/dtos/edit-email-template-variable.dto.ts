import { PartialType } from '@nestjs/swagger';
import { CreateEmailTemplateVariableInputDto } from '../../create-email-template-variable/dtos/create-email-template-variable.dto';

export class EditEmailTemplateVariableInputDto extends PartialType(CreateEmailTemplateVariableInputDto) {}
