import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { EmailTemplateVariableNotFoundError } from '../../../domain/errors/email-template-variable-not-found.error';
import { EmailTemplateVariableDto } from '../../dtos/email-template-variable.dto';
import type { IEmailTemplateVariableDao } from '../../persistence/dao/email-template-variable-dao.interface';

@Injectable()
export class FindEmailTemplateVariableById {
  constructor(
    @Inject(TOKENS.EmailTemplateVariableDao) private readonly emailTemplateVariableDao: IEmailTemplateVariableDao,
  ) {}

  public async execute(id: number): Promise<EmailTemplateVariableDto> {
    const emailTemplateVariable = await this.emailTemplateVariableDao.findById(id);
    if (!emailTemplateVariable) {
      throw new EmailTemplateVariableNotFoundError();
    }

    return emailTemplateVariable;
  }
}
