import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { FaqDto } from '../../dtos/faq.dto';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { FindAllFaqQueryDto } from './dtos/find-all-faq.dto';

@Injectable()
export class FindAllFaq {
  constructor(
    @Inject(TOKENS.FaqDao) private readonly faqDao: IFaqDao,
  ) {}

  public async execute(queries: FindAllFaqQueryDto): Promise<IPagination<FaqDto>> {
    const [result, total] = await this.faqDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
