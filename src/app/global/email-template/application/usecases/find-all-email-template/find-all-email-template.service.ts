import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { EmailTemplateDto } from '../../dtos/email-template.dto';
import type { IEmailTemplateDao } from '../../persistence/dao/email-template-dao.interface';
import { FindAllEmailTemplateQueryDto } from './dtos/find-all-email-template.dto';

@Injectable()
export class FindAllEmailTemplate {
  constructor(
    @Inject(TOKENS.EmailTemplateDao) private readonly emailTemplateDao: IEmailTemplateDao,
  ) {}

  public async execute(queries: FindAllEmailTemplateQueryDto): Promise<IPagination<EmailTemplateDto>> {
    const [result, total] = await this.emailTemplateDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
