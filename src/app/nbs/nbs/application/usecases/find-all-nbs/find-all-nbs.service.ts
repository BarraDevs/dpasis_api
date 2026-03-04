import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { NbsDto } from '../../dtos/nbs.dto';
import type { INbsDao } from '../../persistence/dao/nbs-dao.interface';
import { FindAllNbsQueryDto } from './dtos/find-all-nbs.dto';

@Injectable()
export class FindAllNbs {
  constructor(
    @Inject(TOKENS.NbsDao) private readonly nbsDao: INbsDao,
  ) {}

  public async execute(queries: FindAllNbsQueryDto): Promise<IPagination<NbsDto>> {
    const [result, total] = await this.nbsDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
