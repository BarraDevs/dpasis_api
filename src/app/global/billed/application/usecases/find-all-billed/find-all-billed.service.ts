import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { BilledDto } from '../../dtos/billed.dto';
import type { IBilledDao } from '../../persistence/dao/billed-dao.interface';
import { FindAllBilledQueryDto } from './dtos/find-all-billed.dto';

@Injectable()
export class FindAllBilled {
  constructor(
    @Inject(TOKENS.BilledDao) private readonly billedDao: IBilledDao,
  ) {}

  public async execute(queries: FindAllBilledQueryDto): Promise<IPagination<BilledDto>> {
    const [result, total] = await this.billedDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
