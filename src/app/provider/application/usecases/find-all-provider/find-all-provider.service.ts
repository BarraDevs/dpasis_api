import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ProviderDto } from '../../dtos/provider.dto';
import type { IProviderDao } from '../../persistence/dao/provider-dao.interface';
import { FindAllProviderQueryDto } from './dtos/find-all-provider.dto';

@Injectable()
export class FindAllProvider {
  constructor(
    @Inject(TOKENS.ProviderDao) private providerDao: IProviderDao,
  ) {}

  public async execute(queries: FindAllProviderQueryDto): Promise<IPagination<ProviderDto>> {
    const [result, total] = await this.providerDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
