import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { HonorificDto } from '../../dtos/honorific.dto';
import type { IHonorificDao } from '../../persistence/dao/honorific-dao.interface';
import { FindAllHonorificQueryDto } from './dtos/find-all-honorific.dto';

@Injectable()
export class FindAllHonorific {
  constructor(
    @Inject(TOKENS.HonorificDao) private readonly honorificDao: IHonorificDao,
  ) {}

  public async execute(queries: FindAllHonorificQueryDto): Promise<IPagination<HonorificDto>> {
    const [result, total] = await this.honorificDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
