import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { EmailTemplateNotFoundError } from '../../../domain/errors/email-template-not-found.error';
import { EmailTemplateDto } from '../../dtos/email-template.dto';
import type { IEmailTemplateDao } from '../../persistence/dao/email-template-dao.interface';

@Injectable()
export class FindEmailTemplateById {
  constructor(
    @Inject(TOKENS.EmailTemplateDao) private readonly emailTemplateDao: IEmailTemplateDao,
  ) {}

  public async execute(id: number): Promise<EmailTemplateDto> {
    const emailTemplate = await this.emailTemplateDao.findById(id);
    if (!emailTemplate) {
      throw new EmailTemplateNotFoundError();
    }

    return emailTemplate;
  }
}
