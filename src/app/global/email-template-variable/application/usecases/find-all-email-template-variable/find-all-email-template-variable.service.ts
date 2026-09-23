import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { EmailTemplateVariableDto } from '../../dtos/email-template-variable.dto';
import type { IEmailTemplateVariableDao } from '../../persistence/dao/email-template-variable-dao.interface';
import { FindAllEmailTemplateVariableQueryDto } from './dtos/find-all-email-template-variable.dto';

@Injectable()
export class FindAllEmailTemplateVariable {
  constructor(
    @Inject(TOKENS.EmailTemplateVariableDao) private readonly emailTemplateVariableDao: IEmailTemplateVariableDao,
  ) {}

  public async execute(queries: FindAllEmailTemplateVariableQueryDto): Promise<IPagination<EmailTemplateVariableDto>> {
    const [result, total] = await this.emailTemplateVariableDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
