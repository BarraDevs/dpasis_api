import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { IndopDto } from '../../dtos/indop.dto';
import type { IIndopDao } from '../../persistence/dao/indop-dao.interface';
import { FindAllIndopQueryDto } from './dtos/find-all-indop.dto';

@Injectable()
export class FindAllIndop {
  constructor(
    @Inject(TOKENS.IndopDao) private readonly indopDao: IIndopDao,
  ) {}

  public async execute(queries: FindAllIndopQueryDto): Promise<IPagination<IndopDto>> {
    const [result, total] = await this.indopDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
