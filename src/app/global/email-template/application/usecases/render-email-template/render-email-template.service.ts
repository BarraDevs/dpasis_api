import { Injectable } from '@nestjs/common';
import { FindActiveEmailTemplateVariablesByKeys } from 'src/app/global/email-template-variable/application/usecases/find-active-email-template-variables-by-keys/find-active-email-template-variables-by-keys.service';
import {
  extractEmailTemplatePlaceholderKeys,
  interpolateEmailTemplate,
} from '../../../domain/email-template-renderer';
import { EmailTemplateVariableMissingValueError } from '../../../domain/errors/email-template-variable-missing-value.error';
import { EmailTemplateVariableUnknownError } from '../../../domain/errors/email-template-variable-unknown.error';
import { FindEmailTemplateById } from '../find-email-template-by-id/find-email-template-by-id.service';
import { RenderEmailTemplateInputDto, RenderEmailTemplateOutputDto } from './dtos/render-email-template.dto';

@Injectable()
export class RenderEmailTemplate {
  constructor(
    private readonly findEmailTemplateById: FindEmailTemplateById,
    private readonly findActiveEmailTemplateVariablesByKeys: FindActiveEmailTemplateVariablesByKeys,
  ) {}

  public async execute(id: number, data: RenderEmailTemplateInputDto): Promise<RenderEmailTemplateOutputDto> {
    const template = await this.findEmailTemplateById.execute(id);
    const keys = extractEmailTemplatePlaceholderKeys(template.subject, template.html);
    const catalog = await this.findActiveEmailTemplateVariablesByKeys.execute(keys);
    const catalogKeys = new Set(catalog.map(item => item.key));

    const unknown = keys.filter(key => !catalogKeys.has(key));
    if (unknown.length > 0) {
      throw new EmailTemplateVariableUnknownError(unknown);
    }

    const missing = keys.filter(key => !Object.prototype.hasOwnProperty.call(data.variables, key));
    if (missing.length > 0) {
      throw new EmailTemplateVariableMissingValueError(missing);
    }

    const subject = interpolateEmailTemplate(template.subject, data.variables);
    const html = interpolateEmailTemplate(template.html, data.variables);

    return { subject, html };
  }
}
