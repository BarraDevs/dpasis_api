import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { EmailTemplateVariableNotFoundError } from '../../../domain/errors/email-template-variable-not-found.error';
import type { IEmailTemplateVariableDao } from '../../persistence/dao/email-template-variable-dao.interface';

@Injectable()
export class UpdateEmailTemplateVariableStatus {
  constructor(
    @Inject(TOKENS.EmailTemplateVariableDao) private readonly emailTemplateVariableDao: IEmailTemplateVariableDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const emailTemplateVariable = await this.emailTemplateVariableDao.findById(id);
    if (!emailTemplateVariable) {
      throw new EmailTemplateVariableNotFoundError();
    }

    await this.emailTemplateVariableDao.updateStatus(id, !emailTemplateVariable.active);

    return { message: 'Status da variável de template de e-mail atualizado com sucesso' };
  }
}
