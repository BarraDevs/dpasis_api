import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { EmailTemplateNotFoundError } from '../../../domain/errors/email-template-not-found.error';
import type { IEmailTemplateDao } from '../../persistence/dao/email-template-dao.interface';

@Injectable()
export class DeleteEmailTemplate {
  constructor(
    @Inject(TOKENS.EmailTemplateDao) private readonly emailTemplateDao: IEmailTemplateDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const emailTemplate = await this.emailTemplateDao.findById(id);
    if (!emailTemplate) {
      throw new EmailTemplateNotFoundError();
    }

    await this.emailTemplateDao.delete(id);

    return { message: 'Exclusão realizada com sucesso' };
  }
}
