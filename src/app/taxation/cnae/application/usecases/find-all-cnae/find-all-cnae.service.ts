import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CnaeDto } from '../../dtos/cnae.dto';
import type { ICnaeDao } from '../../persistence/dao/cnae-dao.interface';
import { FindAllCnaeQueryDto } from './dtos/find-all-cnae.dto';

@Injectable()
export class FindAllCnae {
  constructor(
    @Inject(TOKENS.CnaeDao) private readonly cnaeDao: ICnaeDao,
  ) {}

  public async execute(queries: FindAllCnaeQueryDto): Promise<IPagination<CnaeDto>> {
    const [result, total] = await this.cnaeDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
