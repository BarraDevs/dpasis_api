import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CnaeNbsIndopDto } from '../../dtos/cnae-nbs-indop.dto';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';
import { FindAllCnaeNbsIndopQueryDto } from './dtos/find-all-cnae-nbs-indop.dto';

@Injectable()
export class FindAllCnaeNbsIndop {
  constructor(
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
  ) {}

  public async execute(queries: FindAllCnaeNbsIndopQueryDto): Promise<IPagination<CnaeNbsIndopDto>> {
    const [result, total] = await this.cnaeNbsIndopDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
