import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { EmailTemplateVariableDto } from '../../dtos/email-template-variable.dto';
import type { IEmailTemplateVariableDao } from '../../persistence/dao/email-template-variable-dao.interface';

@Injectable()
export class FindActiveEmailTemplateVariablesByKeys {
  constructor(
    @Inject(TOKENS.EmailTemplateVariableDao) private readonly emailTemplateVariableDao: IEmailTemplateVariableDao,
  ) {}

  public async execute(keys: string[]): Promise<EmailTemplateVariableDto[]> {
    if (keys.length === 0) {
      return [];
    }

    return this.emailTemplateVariableDao.findActiveByKeys(keys);
  }
}
