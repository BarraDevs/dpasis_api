import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { EmailTemplateAlreadyExistsError } from '../../../domain/errors/email-template-already-exists.error';
import type { IEmailTemplateDao } from '../../persistence/dao/email-template-dao.interface';
import { CreateEmailTemplateInputDto, CreateEmailTemplateOutputDto } from './dtos/create-email-template.dto';

@Injectable()
export class CreateEmailTemplate {
  constructor(
    @Inject(TOKENS.EmailTemplateDao) private readonly emailTemplateDao: IEmailTemplateDao,
  ) {}

  public async execute(data: CreateEmailTemplateInputDto): Promise<CreateEmailTemplateOutputDto> {
    const name = data.name.trim();
    const existing = await this.emailTemplateDao.findByName(name);
    if (existing) {
      throw new EmailTemplateAlreadyExistsError(name);
    }

    const id = await this.emailTemplateDao.save({ ...data, name });
    return { id };
  }
}
