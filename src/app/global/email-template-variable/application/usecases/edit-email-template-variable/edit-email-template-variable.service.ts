import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { EmailTemplateVariableAlreadyExistsError } from '../../../domain/errors/email-template-variable-already-exists.error';
import { EmailTemplateVariableNotFoundError } from '../../../domain/errors/email-template-variable-not-found.error';
import type { IEmailTemplateVariableDao } from '../../persistence/dao/email-template-variable-dao.interface';
import { EditEmailTemplateVariableInputDto } from './dtos/edit-email-template-variable.dto';

@Injectable()
export class EditEmailTemplateVariable {
  constructor(
    @Inject(TOKENS.EmailTemplateVariableDao) private readonly emailTemplateVariableDao: IEmailTemplateVariableDao,
  ) {}

  public async execute(id: number, data: EditEmailTemplateVariableInputDto): Promise<SuccessMessage> {
    const emailTemplateVariable = await this.emailTemplateVariableDao.findById(id);
    if (!emailTemplateVariable) {
      throw new EmailTemplateVariableNotFoundError();
    }

    if (data.key !== undefined) {
      const key = data.key.trim();
      const existing = await this.emailTemplateVariableDao.findByKey(key);
      if (existing && existing.id !== id) {
        throw new EmailTemplateVariableAlreadyExistsError(key);
      }
      await this.emailTemplateVariableDao.edit(id, { ...data, key });
    } else {
      await this.emailTemplateVariableDao.edit(id, data);
    }

    return { message: 'Edição realizada com sucesso' };
  }
}
