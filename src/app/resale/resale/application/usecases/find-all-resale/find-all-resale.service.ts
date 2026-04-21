import { Inject, Injectable } from '@nestjs/common';
import { ResaleDto } from 'src/app/resale/resale/application/dtos/resale.dto';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import type { IResaleDao } from '../../persistence/dao/resale-dao.interface';
import { FindAllResaleQueryDto } from './dtos/find-all-resale.dto';

@Injectable()
export class FindAllResale {
  constructor(
    @Inject(TOKENS.ResaleDao) private readonly resaleDao: IResaleDao,
  ) {}

  public async execute(queries: FindAllResaleQueryDto): Promise<IPagination<ResaleDto>> {
    const [result, total] = await this.resaleDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
