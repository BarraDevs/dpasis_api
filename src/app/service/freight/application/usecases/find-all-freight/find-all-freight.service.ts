import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { FreightDto } from '../../dtos/freight.dto';
import type { IFreightDao } from '../../persistence/dao/freight-dao.interface';
import { FindAllFreightQueryDto } from './dtos/find-all-freight.dto';

@Injectable()
export class FindAllFreight {
  constructor(
    @Inject(TOKENS.FreightDao) private readonly freightDao: IFreightDao,
  ) {}

  public async execute(queries: FindAllFreightQueryDto): Promise<IPagination<FreightDto>> {
    const [result, total] = await this.freightDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
