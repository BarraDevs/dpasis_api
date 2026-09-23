import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { EmailTemplateAlreadyExistsError } from '../../../domain/errors/email-template-already-exists.error';
import { EmailTemplateNotFoundError } from '../../../domain/errors/email-template-not-found.error';
import type { IEmailTemplateDao } from '../../persistence/dao/email-template-dao.interface';
import { EditEmailTemplateInputDto } from './dtos/edit-email-template.dto';

@Injectable()
export class EditEmailTemplate {
  constructor(
    @Inject(TOKENS.EmailTemplateDao) private readonly emailTemplateDao: IEmailTemplateDao,
  ) {}

  public async execute(id: number, data: EditEmailTemplateInputDto): Promise<SuccessMessage> {
    const emailTemplate = await this.emailTemplateDao.findById(id);
    if (!emailTemplate) {
      throw new EmailTemplateNotFoundError();
    }

    if (data.name !== undefined) {
      const name = data.name.trim();
      const existing = await this.emailTemplateDao.findByName(name);
      if (existing && existing.id !== id) {
        throw new EmailTemplateAlreadyExistsError(name);
      }
      await this.emailTemplateDao.edit(id, { ...data, name });
    } else {
      await this.emailTemplateDao.edit(id, data);
    }

    return { message: 'Edição realizada com sucesso' };
  }
}
