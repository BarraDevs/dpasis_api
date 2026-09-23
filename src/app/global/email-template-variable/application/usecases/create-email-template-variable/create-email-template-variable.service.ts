import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { EmailTemplateVariableAlreadyExistsError } from '../../../domain/errors/email-template-variable-already-exists.error';
import type { IEmailTemplateVariableDao } from '../../persistence/dao/email-template-variable-dao.interface';
import { CreateEmailTemplateVariableInputDto, CreateEmailTemplateVariableOutputDto } from './dtos/create-email-template-variable.dto';

@Injectable()
export class CreateEmailTemplateVariable {
  constructor(
    @Inject(TOKENS.EmailTemplateVariableDao) private readonly emailTemplateVariableDao: IEmailTemplateVariableDao,
  ) {}

  public async execute(data: CreateEmailTemplateVariableInputDto): Promise<CreateEmailTemplateVariableOutputDto> {
    const key = data.key.trim();
    const existing = await this.emailTemplateVariableDao.findByKey(key);
    if (existing) {
      throw new EmailTemplateVariableAlreadyExistsError(key);
    }

    const id = await this.emailTemplateVariableDao.save({ ...data, key });
    return { id };
  }
}
